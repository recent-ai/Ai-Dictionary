import type {
	Granularity,
	PipelineBucket,
	PipelineStats,
} from "@/lib/pipeline-stats";

/**
 * The signal meter — the landing page's proof.
 *
 * One column per bucket: a week while the pipeline's history is short, a month
 * once there is enough of it. Full column height is everything the pipeline
 * read in that window; the bright segment at the base is what it kept. So the
 * graphic answers "how much noise, how much signal" at a glance, and the shape
 * is real: reads climb while the kept band thins, because the filter got
 * stricter as volume grew.
 *
 * Deliberate encoding choices:
 *
 * - **One axis.** Read and kept differ by ~80x, so plotting them as two series
 *   against two y-scales would invent a relationship that isn't in the data.
 *   Kept is a subset of read in the same unit, so it's drawn as part-to-whole
 *   inside one column instead — no second scale, nothing to misalign.
 * - **One clock.** A bucket holds the items *ingested* in that window and the
 *   entries those items became, whenever they were published. Both halves of
 *   every column are therefore the same population, which is the only thing
 *   that makes part-to-whole legitimate here.
 * - **In-flight isn't rejected.** The keep rate is measured against the items
 *   the queue has finished with, so a bucket the bot hasn't caught up on yet
 *   shows its volume and no rate — rather than a 0% that only means "not yet".
 * - **Empty buckets are drawn, not dropped.** The pipeline was idle for a
 *   stretch; removing those columns would compress the axis and imply it ran
 *   throughout.
 * - **Labels are sparing.** Only the two endpoints of the story carry a direct
 *   label; the axis ticks carry the values in between, and the table twin carries
 *   all of them.
 * - **Indigo for kept, gray for read.** Validated: adjacent ΔE 33+ under protan,
 *   deutan and tritan simulation in both themes. The gray track sits below 3:1
 *   against the surface by design — it's recessive context — so the values stay
 *   reachable as text, and nothing is gated behind color or hover.
 *
 * Server-rendered from static counts: no client JS, no animation loop. The
 * hover/focus readout is pure CSS, so it works before and without hydration.
 */

/** Plot height in px, excluding the label band beneath it. */
const PLOT_H = 176;

/** The surface gap, in px, separating the two stacked segments of a column. */
const GAP = 2;

/**
 * A count that couldn't be read prints as an em dash, never as zero — a bucket
 * whose query failed is not a window in which nothing happened.
 */
function formatCount(value: number | null) {
	if (value === null) {
		return "—";
	}
	return new Intl.NumberFormat("en-US").format(value);
}

/**
 * The keep rate, or null when there is nothing decided to take it over.
 *
 * `resolved` — not `read` — is the denominator on purpose. An item still
 * `pending` or `processing` has no verdict, and counting it as a rejection is
 * what turned the two most recent months into a flat 0%: the bot simply hadn't
 * reached them yet. Null here means "no rate exists", which every caller
 * renders as an absence rather than as a number.
 */
function formatRate(kept: number, resolved: number) {
	if (resolved <= 0) {
		return null;
	}
	const rate = (kept / resolved) * 100;
	return `${rate.toFixed(rate < 10 ? 1 : 0)}%`;
}

/** The short form under a column: "Sep" / "Sep 26" monthly, "Sep 8" weekly. */
function bucketLabel(iso: string, granularity: Granularity, withYear: boolean) {
	return new Intl.DateTimeFormat("en", {
		month: "short",
		...(granularity === "week" ? { day: "numeric" } : {}),
		...(withYear ? { year: "2-digit" } : {}),
		timeZone: "UTC",
	}).format(new Date(iso));
}

/** The long form for the readout, the table and the accessible name. */
function bucketTitle(iso: string, granularity: Granularity) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	if (granularity === "month") {
		return new Intl.DateTimeFormat("en", {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		}).format(date);
	}
	const day = new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
	return `Week of ${day}`;
}

function formatMonthYear(iso: string | null) {
	if (!iso) {
		return null;
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return new Intl.DateTimeFormat("en", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

/** Round up to a clean top so column heights aren't scaled to an odd max. */
function axisTop(max: number) {
	if (max <= 0) {
		return 1;
	}
	const magnitude = 10 ** Math.floor(Math.log10(max));
	const step = magnitude / 2;
	return Math.ceil(max / step) * step;
}

/**
 * The volume half of the caption, stating its own direction.
 *
 * This used to hardcode "grew", which becomes a falsehood — "grew 0.5×" — the
 * first period the pipeline reads less than it did at the start. The verb is
 * read off the rounded multiplier rather than the raw ratio, so the word and
 * the number can't disagree, and the multiplier stays above 1 in both
 * directions: "fell 2.0×" is the sentence, not "fell 0.5×".
 *
 * `first` is guaranteed non-zero by the `read > 0` filter on the endpoints.
 */
function volumePhrase(first: number, last: number) {
	const grew = last >= first;
	const factor = (grew ? last / first : first / last).toFixed(1);
	if (factor === "1.0") {
		return "remained unchanged";
	}
	return `${grew ? "grew" : "fell"} ${factor}×`;
}

function BucketColumn({
	bucket,
	granularity,
	top,
	annotate,
}: {
	bucket: PipelineBucket;
	granularity: Granularity;
	top: number;
	/** Endpoints of the story get a direct label; every other column stays clean. */
	annotate: boolean;
}) {
	const { read, kept } = bucket;
	const readH = read > 0 ? Math.max((read / top) * PLOT_H, 2) : 0;
	const keptH = kept > 0 ? Math.max((kept / top) * PLOT_H, 2) : 0;
	// The unkept remainder, shortened by the gap so the stack still totals readH.
	const restH = keptH > 0 ? Math.max(readH - keptH - GAP, 0) : readH;

	const title = bucketTitle(bucket.start, granularity);
	const rate = formatRate(kept, bucket.resolved);
	// Volume without a verdict. Said in words rather than shown as 0%, because
	// the two mean opposite things and only one of them is a result.
	const undecided = read > 0 && bucket.resolved === 0;

	return (
		<div
			className={`group relative flex min-w-0 flex-1 flex-col items-center justify-end self-stretch${
				bucket.partial ? " opacity-60" : ""
			}`}
		>
			{/* Readout on hover or keyboard focus. It supplements the axis and the
			    table; it never holds the only copy of a value. */}
			<div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left whitespace-nowrap shadow-sm group-hover:block group-focus-within:block">
				<p className="text-[11px] font-semibold">
					{title}
					{bucket.partial ? " (in progress)" : ""}
				</p>
				<p className="text-[11px] text-muted-foreground tabular-nums">
					{formatCount(read)} read · {formatCount(kept)} kept
					{rate ? ` · ${rate}` : undecided ? " · awaiting triage" : ""}
				</p>
			</div>

			{annotate && rate ? (
				<span className="mb-1.5 text-[11px] leading-none font-semibold whitespace-nowrap text-foreground tabular-nums">
					{rate} kept
				</span>
			) : null}

			{/* The column: rounded at the data end, square at the baseline. */}
			<div
				className="flex w-full max-w-6 flex-col justify-end"
				style={{ height: readH }}
			>
				{restH > 0 ? (
					<div
						className="rounded-t bg-neutral-300 dark:bg-zinc-700"
						style={{ height: restH }}
					/>
				) : null}
				{keptH > 0 ? (
					<div
						className={`bg-brand ${restH > 0 ? "mt-[2px]" : "rounded-t"}`}
						style={{ height: keptH }}
					/>
				) : null}
			</div>

			{/* Hit target for the readout: the whole column slot, not the 24px bar. */}
			<button
				type="button"
				aria-label={`${title}: ${formatCount(read)} read, ${formatCount(
					kept,
				)} kept${rate ? `, ${rate} kept` : undecided ? ", awaiting triage" : ""}`}
				className="absolute inset-0 cursor-default rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
		</div>
	);
}

export function SignalMeter({ stats }: { stats: PipelineStats }) {
	const { buckets, granularity } = stats;

	// Without buckets there is no shape to draw, and inventing one would make the
	// page lie. Drop the section instead.
	if (buckets.length < 2) {
		return null;
	}

	const period = granularity === "week" ? "week" : "month";
	const top = axisTop(Math.max(...buckets.map((b) => b.read)));
	// Three ticks — top, midpoint, baseline. They carry the values the columns
	// no longer print.
	const tickValues = [top, top / 2, 0];

	// The story's endpoints: the first and last buckets that read something *and*
	// have been decided. A bucket that kept nothing still scores — 0% is a
	// reading, not a gap — but one whose items are all still queued has no rate
	// at all, and a closed window is the only kind whose volume is comparable to
	// another's, so the trailing in-flight bucket can't be an endpoint either.
	const scored = buckets.filter(
		(b) => b.read > 0 && b.resolved > 0 && !b.partial,
	);
	const firstScored = scored.at(0);
	const lastScored = scored.at(-1);
	const annotated = new Set(
		[firstScored?.start, lastScored?.start].filter(Boolean),
	);

	// Stated, not implied. The direction is read off the data rather than
	// assumed, so a period where the filter loosens doesn't turn this into a lie.
	const caption =
		firstScored && lastScored && firstScored.start !== lastScored.start
			? `Keep rate ${
					lastScored.kept / lastScored.resolved <
					firstScored.kept / firstScored.resolved
						? "fell"
						: "rose"
				} from ${formatRate(
					firstScored.kept,
					firstScored.resolved,
				)} in ${bucketTitle(firstScored.start, granularity)} to ${formatRate(
					lastScored.kept,
					lastScored.resolved,
				)} in ${bucketTitle(
					lastScored.start,
					granularity,
				)}, while the volume read each ${period} ${volumePhrase(
					firstScored.read,
					lastScored.read,
				)}.`
			: null;

	// Why the newest columns carry no percentage. Without this the reader is left
	// to guess whether the label is missing or the rate is zero.
	const pending = buckets.some(
		(b) => b.read > 0 && (b.partial || b.resolved < b.read),
	);

	return (
		<section
			aria-labelledby="signal-meter-heading"
			className="rounded-2xl border border-border bg-hue-1-wash p-6 md:p-8"
		>
			<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
				{/* Text column. First in the DOM so it reads first on a phone; moved to
				    the right on desktop, where the plot wants the width. */}
				<div className="lg:order-2">
					<h2 id="signal-meter-heading" className="text-base font-semibold">
						Read vs. kept, by {period}
					</h2>

					{/* Two series, so a legend is always present — identity never depends
					    on matching colours from memory. */}
					<dl className="mt-4 space-y-2 text-sm">
						<div className="flex items-center gap-2">
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-sm bg-brand"
								aria-hidden="true"
							/>
							<dt className="font-medium">Kept</dt>
							<dd className="text-muted-foreground">survived the filter</dd>
						</div>
						<div className="flex items-center gap-2">
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-sm bg-neutral-300 dark:bg-zinc-700"
								aria-hidden="true"
							/>
							<dt className="font-medium">Read</dt>
							<dd className="text-muted-foreground">everything ingested</dd>
						</div>
					</dl>

					{caption ? (
						<p className="mt-5 text-sm leading-relaxed text-muted-foreground">
							{caption}
						</p>
					) : null}

					{pending ? (
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Rates are measured against the items already triaged. The most
							recent {period}s are still working through the queue, so their
							volume is plotted without one.
						</p>
					) : null}
				</div>

				{/* Plot column. The left padding is the tick gutter. */}
				<div className="min-w-0 lg:order-1">
					<div className="relative pl-11">
						<div className="relative" style={{ height: PLOT_H }}>
							{/* Hairline solid gridlines, one step off the surface. */}
							{tickValues.map((value) => (
								<div
									key={value}
									aria-hidden="true"
									className="absolute inset-x-0"
									style={{ top: PLOT_H - (value / top) * PLOT_H }}
								>
									<span className="absolute right-full -translate-y-1/2 pr-3 text-[11px] leading-none text-muted-foreground tabular-nums">
										{formatCount(value)}
									</span>
									<div
										className={`h-px w-full ${
											value === 0 ? "bg-border" : "bg-border/50"
										}`}
									/>
								</div>
							))}

							<div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
								{buckets.map((bucket) => (
									<BucketColumn
										key={bucket.start}
										bucket={bucket}
										granularity={granularity}
										top={top}
										annotate={annotated.has(bucket.start)}
									/>
								))}
							</div>
						</div>

						{/* Label band, outside the plot box so nothing is clipped by it.
						    Same flex geometry, so the labels stay under their columns. */}
						<div className="mt-3 flex gap-1.5 sm:gap-3">
							{buckets.map((bucket, i) => (
								<span
									key={bucket.start}
									className="min-w-0 flex-1 text-center text-[11px] leading-none text-muted-foreground"
								>
									{bucketLabel(bucket.start, granularity, i === 0)}
								</span>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* The table twin: every plotted value as text, so the chart is never the
			    only way to reach the data. */}
			<details className="group mt-8">
				<summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
					<span className="transition-transform group-open:rotate-90">›</span>
					View as table
				</summary>
				<div className="mt-3 overflow-x-auto">
					<table className="w-full min-w-80 text-left text-xs tabular-nums">
						<thead className="text-muted-foreground">
							<tr className="border-b border-border">
								<th scope="col" className="py-2 pr-4 font-normal">
									{granularity === "week" ? "Week" : "Month"}
								</th>
								<th scope="col" className="py-2 pr-4 text-right font-normal">
									Read
								</th>
								<th scope="col" className="py-2 pr-4 text-right font-normal">
									Triaged
								</th>
								<th scope="col" className="py-2 pr-4 text-right font-normal">
									Kept
								</th>
								<th scope="col" className="py-2 text-right font-normal">
									Kept rate
								</th>
							</tr>
						</thead>
						<tbody>
							{buckets.map((bucket) => (
								<tr key={bucket.start} className="border-b border-border/50">
									<th scope="row" className="py-2 pr-4 font-normal">
										{bucketTitle(bucket.start, granularity)}
									</th>
									<td className="py-2 pr-4 text-right">
										{formatCount(bucket.read)}
									</td>
									<td className="py-2 pr-4 text-right">
										{formatCount(bucket.resolved)}
									</td>
									<td className="py-2 pr-4 text-right">
										{formatCount(bucket.kept)}
									</td>
									<td className="py-2 text-right">
										{formatRate(bucket.kept, bucket.resolved) ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</section>
	);
}

/**
 * The instrument readout — all-time figures, as a column beside the headline.
 *
 * Separate from the chart because these are single current values: a KPI list,
 * not a plot. Proportional figures on the values — `tabular-nums` gives every
 * digit the width of a zero, which makes a number like 244 look loose at this
 * size; it's reserved for the axis ticks and the table, where digits stack.
 */
export function PipelineReadout({ stats }: { stats: PipelineStats }) {
	const { articlesRead, entriesKept, resolved, sources, firstRun } = stats;

	// Null, not falsy. A count that failed to read has nothing to print, but a
	// genuine zero is a reading and belongs on the board — and dropping the whole
	// readout over it would take the sources and the start date with it.
	if (articlesRead === null || entriesKept === null) {
		return null;
	}

	const since = formatMonthYear(firstRun);
	const rows: Array<[string, string]> = [
		["Articles read", formatCount(articlesRead)],
		["Entries kept", formatCount(entriesKept)],
	];

	// Over the triaged population, for the same reason the chart's rates are:
	// dividing all-time reads by all-time keeps counted everything still in the
	// queue as noise, and printed "1 in 0" the moment the backlog outweighed the
	// published set. The row is dropped outright unless the ratio is a real one —
	// "1 in 0" and "1 in Infinity" are not statements about signal.
	const ratio =
		entriesKept > 0 && resolved !== null
			? Math.round(resolved / entriesKept)
			: 0;
	const highlight = ratio >= 1 ? "Signal-to-noise" : null;
	if (highlight) {
		rows.push([highlight, `1 in ${ratio}`]);
	}
	if (sources) {
		rows.push(["Sources", String(sources)]);
	}
	if (since) {
		rows.push(["Running since", since]);
	}

	return (
		<dl className="divide-y divide-border/60 border-b border-border/60">
			{/* A gradient rule caps the column instead of a flat border. The readout
			    is the one place on the page where colour can sit next to the headline
			    without landing on any type. */}
			<div className="rule-accent h-px" aria-hidden="true" />
			{rows.map(([label, value]) => (
				<div
					key={label}
					className="flex items-baseline justify-between gap-4 py-3"
				>
					<dt className="text-sm text-muted-foreground">{label}</dt>
					{/* Only the ratio is coloured — it's the figure the whole page is
					    arguing for, and colouring one value in five marks it as the
					    headline number without turning the column into a rainbow. Keyed
					    off the label, not the row index: the ratio row is conditional,
					    and an index would paint whichever row slid into its place. */}
					<dd
						className={
							label === highlight
								? "text-lg font-semibold text-brand"
								: "text-lg font-semibold"
						}
					>
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}
