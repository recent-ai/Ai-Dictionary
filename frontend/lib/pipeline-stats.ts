import { createStaticClient } from "@/lib/supabase/static";

/**
 * Real pipeline numbers for the landing page.
 *
 * The homepage makes a factual claim — "we read N, we kept M" — so every number
 * here is counted from the database. Nothing is estimated or hardcoded. If a
 * count can't be read, the field comes back null and the UI drops that figure
 * rather than printing a zero, because a confident "0 sources" is worse than
 * saying nothing.
 */
/** One calendar month of pipeline throughput. */
export type MonthBucket = {
	/** First day of the month, ISO — the sort key and label source. */
	month: string;
	/** Raw items ingested that month, or null if the count couldn't be read. */
	read: number | null;
	/** Entries approved that month, or null if the count couldn't be read. */
	kept: number | null;
};

export type PipelineStats = {
	/** Raw items ingested by the source adapters, all time. */
	articlesRead: number | null;
	/** Entries that survived deduplication and generation. */
	entriesKept: number | null;
	/** Distinct source adapters that have contributed at least one item. */
	sources: number | null;
	/** ISO timestamp of the most recent ingest. */
	lastRun: string | null;
	/** ISO timestamp of the earliest ingest — the "since" in the headline. */
	firstRun: string | null;
	/**
	 * Month-by-month throughput, oldest first, with no gaps.
	 *
	 * Months where the pipeline didn't run are included at zero rather than
	 * dropped. Skipping them would compress the axis and make an idle stretch
	 * look like continuous operation.
	 */
	months: MonthBucket[];
};

const EMPTY: PipelineStats = {
	articlesRead: null,
	entriesKept: null,
	sources: null,
	lastRun: null,
	firstRun: null,
	months: [],
};

export async function getPipelineStats(): Promise<PipelineStats> {
	let supabase: ReturnType<typeof createStaticClient>;
	try {
		supabase = createStaticClient();
	} catch (error) {
		console.error("Pipeline stats: no Supabase client", error);
		return EMPTY;
	}

	// The table names have to stay inline literals rather than a `table: string`
	// parameter — the generated Database types key off the literal, so a generic
	// helper loses the row typing for every caller.
	const countRawItems = async () => {
		const { count, error } = await supabase
			.from("raw_api_data")
			.select("*", { count: "exact", head: true });
		if (error) {
			console.error(
				"Pipeline stats: count(raw_api_data) failed",
				error.message,
			);
			return null;
		}
		return count ?? null;
	};

	const countLiveEntries = async () => {
		const { count, error } = await supabase
			.from("post_content")
			.select("*", { count: "exact", head: true })
			.eq("isoldpost", false);
		if (error) {
			console.error(
				"Pipeline stats: count(post_content) failed",
				error.message,
			);
			return null;
		}
		return count ?? null;
	};

	// PostgREST has no COUNT(DISTINCT), so the source names are pulled and
	// reduced here.
	//
	// This pages deliberately. PostgREST enforces a server-side ceiling of 1000
	// rows per response and silently truncates past it — `.limit(10000)` looks
	// like it works and returns 1000. Reducing a truncated sample would quietly
	// understate the figure the moment a source only appears late in the table,
	// so the pages are walked to the end instead. One short column, ~5 requests,
	// and the page is revalidated hourly.
	const distinctSources = async () => {
		const PAGE = 1000;
		const MAX_PAGES = 50; // ~50k rows; a backstop, not an expected bound.
		const names = new Set<string>();

		for (let page = 0; page < MAX_PAGES; page++) {
			const from = page * PAGE;
			const { data, error } = await supabase
				.from("raw_api_data")
				.select("source_name")
				.order("id", { ascending: true })
				.range(from, from + PAGE - 1);

			if (error) {
				console.error("Pipeline stats: sources failed", error.message);
				return null;
			}
			for (const row of data ?? []) {
				if (row.source_name) {
					names.add(row.source_name);
				}
			}
			if (!data || data.length < PAGE) {
				return names.size;
			}
		}

		console.warn("Pipeline stats: sources hit the page ceiling");
		return names.size;
	};

	const edgeTimestamp = async (ascending: boolean) => {
		const { data, error } = await supabase
			.from("raw_api_data")
			.select("created_at")
			.order("created_at", { ascending })
			.limit(1);
		if (error) {
			return null;
		}
		return data?.[0]?.created_at ?? null;
	};

	/**
	 * Monthly throughput between two ISO timestamps.
	 *
	 * Counted with head requests per month rather than by pulling rows, so the
	 * 1000-row response ceiling can't truncate a bucket. That's two requests per
	 * month — cheap at hourly revalidation, and exact.
	 */
	const monthlyBuckets = async (
		firstIso: string | null,
		lastIso: string | null,
	): Promise<MonthBucket[]> => {
		if (!firstIso || !lastIso) {
			return [];
		}
		const first = new Date(firstIso);
		const last = new Date(lastIso);
		if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
			return [];
		}

		const edges: Date[] = [];
		const cursor = new Date(
			Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
		);
		const end = new Date(
			Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1),
		);
		// 120 months of headroom; guards against a bad timestamp spinning forever.
		while (cursor <= end && edges.length < 120) {
			edges.push(new Date(cursor));
			cursor.setUTCMonth(cursor.getUTCMonth() + 1);
		}

		const countIn = async (
			table: "raw_api_data" | "posts",
			column: "created_at" | "approveddate",
			from: Date,
			to: Date,
		): Promise<number | null> => {
			const query =
				table === "raw_api_data"
					? supabase.from("raw_api_data").select("*", {
							count: "exact",
							head: true,
						})
					: supabase.from("posts").select("*", { count: "exact", head: true });
			const { count, error } = await query
				.gte(column, from.toISOString())
				.lt(column, to.toISOString());
			// null, not 0: a month that failed to read is not a month with no
			// activity, and the keep rate is computed from these. A successful
			// response with no count really is zero.
			if (error) {
				console.error(`Pipeline stats: ${table} count failed`, error.message);
				return null;
			}
			return count ?? 0;
		};

		return Promise.all(
			edges.map(async (start) => {
				const next = new Date(start);
				next.setUTCMonth(next.getUTCMonth() + 1);
				const [read, kept] = await Promise.all([
					countIn("raw_api_data", "created_at", start, next),
					countIn("posts", "approveddate", start, next),
				]);
				return { month: start.toISOString(), read, kept };
			}),
		);
	};

	const [articlesRead, entriesKept, sources, firstRun, lastRun] =
		await Promise.all([
			countRawItems(),
			countLiveEntries(),
			distinctSources(),
			edgeTimestamp(true),
			edgeTimestamp(false),
		]);

	const months = await monthlyBuckets(firstRun, lastRun);

	return { articlesRead, entriesKept, sources, firstRun, lastRun, months };
}
