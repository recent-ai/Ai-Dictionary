import { createStaticClient } from "@/lib/supabase/static";

/**
 * Real pipeline numbers for the landing page.
 *
 * The homepage makes a factual claim — "we read N, we kept M" — so every number
 * here is counted from the database. Nothing is estimated or hardcoded. If the
 * figures can't be read, they come back null and the UI drops them rather than
 * printing zeros, because a confident "0 sources" is worse than saying nothing.
 *
 * The counting itself lives in `public.pipeline_stats()`, a Security Definer
 * function added by the redesign migration. It has to: `raw_api_data` has RLS on
 * and no read policy, and should keep it that way — the rows carry scraped
 * article bodies, source URLs and triage failure text, none of which belongs on
 * a public page. The function is the seam. It counts rows the anon key cannot
 * see and returns only aggregates, so the landing page gets its proof without
 * the table being opened up. That also makes this one round trip with no
 * PostgREST row ceiling to page around.
 *
 * Everything it returns is counted over one cohort on one clock: a raw item's
 * own ingest timestamp. An item read in September and published in October
 * counts as a September keep, because the question the chart answers is "of what
 * we read then, how much survived" — not "what did we publish this month".
 * Counting `posts.published_at` against `raw_api_data.created_at`, as this file
 * used to, put two different populations on two different clocks: the keep rate
 * could exceed 100%, and the entries backfilled ahead of the pipeline were
 * counted as keeps against reads that were never made.
 */

/** Whether buckets are a week or a calendar month wide. */
export type Granularity = "week" | "month";

/** One bucket of pipeline throughput, on the ingest clock. */
export type PipelineBucket = {
	/** First instant of the bucket, ISO — the sort key and label source. */
	start: string;
	/** Raw items ingested in this bucket. */
	read: number;
	/** Of those, the ones that produced a live entry. */
	kept: number;
	/**
	 * Of those, the ones the queue has finished with.
	 *
	 * The keep rate is `kept / resolved`, not `kept / read`: the denominator is
	 * the decided population. A bucket that is still entirely in flight has
	 * `resolved === 0` and gets no rate at all, rather than a 0% that only means
	 * "not yet".
	 */
	resolved: number;
	/** True while the bucket's own window is still open. */
	partial: boolean;
};

export type PipelineStats = {
	/** Raw items ingested by the source adapters, all time. */
	articlesRead: number | null;
	/** Entries that survived deduplication and generation. */
	entriesKept: number | null;
	/** Raw items the queue has finished with — the keep rate's denominator. */
	resolved: number | null;
	/** Distinct source adapters that have contributed at least one item. */
	sources: number | null;
	/** ISO timestamp of the most recent ingest. */
	lastRun: string | null;
	/** ISO timestamp of the earliest ingest — the "since" in the headline. */
	firstRun: string | null;
	/** Whether `buckets` are weeks or months. */
	granularity: Granularity;
	/**
	 * Throughput bucket by bucket, oldest first, with no gaps.
	 *
	 * Buckets where the pipeline didn't run are included at zero rather than
	 * dropped. Skipping them would compress the axis and make an idle stretch
	 * look like continuous operation.
	 */
	buckets: PipelineBucket[];
};

const EMPTY: PipelineStats = {
	articlesRead: null,
	entriesKept: null,
	resolved: null,
	sources: null,
	lastRun: null,
	firstRun: null,
	granularity: "month",
	buckets: [],
};

/**
 * The function returns `jsonb`, which the generated types can only describe as
 * `Json`. So the payload is narrowed here rather than asserted: a schema change
 * that drops or renames a field should make the section disappear, not render
 * `NaN%` or throw halfway through a static build.
 */
function asRecord(value: unknown): Record<string, unknown> | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function asCount(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asIso(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function asBucket(value: unknown): PipelineBucket | null {
	const row = asRecord(value);
	if (!row) {
		return null;
	}
	const start = asIso(row.start);
	const read = asCount(row.read);
	const kept = asCount(row.kept);
	const resolved = asCount(row.resolved);
	if (start === null || read === null || kept === null || resolved === null) {
		return null;
	}
	return { start, read, kept, resolved, partial: row.partial === true };
}

export async function getPipelineStats(): Promise<PipelineStats> {
	let supabase: ReturnType<typeof createStaticClient>;
	try {
		supabase = createStaticClient();
	} catch (error) {
		console.error("Pipeline stats: no Supabase client", error);
		return EMPTY;
	}

	const { data, error } = await supabase.rpc("pipeline_stats");
	if (error) {
		console.error("Pipeline stats: pipeline_stats() failed", error.message);
		return EMPTY;
	}

	const payload = asRecord(data);
	if (!payload) {
		console.error("Pipeline stats: pipeline_stats() returned no object");
		return EMPTY;
	}

	// One malformed bucket drops the whole series rather than leaving a hole in
	// it. The chart is a part-to-whole shape read left to right, so a column
	// missing from the middle would misstate the trend rather than merely omit a
	// value — the same reason idle buckets are emitted at zero on the SQL side.
	const rows = Array.isArray(payload.buckets) ? payload.buckets : [];
	const parsed = rows.map(asBucket);
	const malformed = parsed.some((bucket) => bucket === null);
	if (malformed) {
		console.error(
			"Pipeline stats: pipeline_stats() returned a malformed bucket",
		);
	}
	const buckets = malformed
		? []
		: (parsed as PipelineBucket[]).sort((a, b) =>
				a.start.localeCompare(b.start),
			);

	return {
		articlesRead: asCount(payload.articles_read),
		entriesKept: asCount(payload.entries_kept),
		resolved: asCount(payload.resolved),
		sources: asCount(payload.sources),
		firstRun: asIso(payload.first_run),
		lastRun: asIso(payload.last_run),
		granularity: payload.granularity === "week" ? "week" : "month",
		buckets,
	};
}
