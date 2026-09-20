import type { MonthBucket, PipelineStats } from "@/lib/pipeline-stats";

/**
 * The signal meter — the landing page's proof.
 *
 * One column per month. Full column height is everything the pipeline read that
 * month; the bright segment at the base is what it kept. So the graphic answers
 * "how much noise, how much signal" at a glance, and the shape is real: reads
 * climb while the kept band thins, because the filter got stricter as volume
 * grew.
 *
 * Deliberate encoding choices:
 *
 * - **One axis.** Read and kept differ by ~80x, so plotting them as two series
 *   against two y-scales would invent a relationship that isn't in the data.
 *   Kept is a subset of read in the same unit, so it's drawn as part-to-whole
 *   inside one column instead — no second scale, nothing to misalign.
 * - **Empty months are drawn, not dropped.** The pipeline was idle for a stretch;
 *   removing those columns would compress the axis and imply it ran throughout.
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

/** Plot height in px, excluding the month band beneath it. */
const PLOT_H = 176;

/** The surface gap, in px, separating the two stacked segments of a column. */
const GAP = 2;

/**
 * A count that couldn't be read prints as an em dash, never as zero — a bucket
 * whose query failed is not a month in which nothing happened.
 */
function formatCount(value: number | null) {
	if (value === null) {
		return "—";
	}
	return new Intl.NumberFormat("en-US").format(value);
}

function formatRate(kept: number | null, read: number | null) {
	if (kept === null || !read) {
		return "—";
	}
	const rate = (kept / read) * 100;
	return `${rate.toFixed(rate < 10 ? 1 : 0)}%`;
}

function monthLabel(iso: string, withYear: boolean) {
	return new Intl.DateTimeFormat("en", {
		month: "short",
		...(withYear ? { year: "2-digit" } : {}),
		timeZone: "UTC",
	}).format(new Date(iso));
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
 * first month the pipeline reads less than it did at the start. The verb is
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

function MonthColumn({
	bucket,
	top,
	annotate,
}: {
	bucket: MonthBucket;
	top: number;
	/** Endpoints of the story get a direct label; every other column stays clean. */
	annotate: boolean;
}) {
	// An unreadable count draws nothing rather than a zero-height column that
	// would read as a quiet month.
	const read = bucket.read ?? 0;
	const kept = bucket.kept ?? 0;
	const readH = read > 0 ? Math.max((read / top) * PLOT_H, 2) : 0;
	const keptH = kept > 0 ? Math.max((kept / top) * PLOT_H, 2) : 0;
	// The unkept remainder, shortened by the gap so the stack still totals readH.
	const restH = keptH > 0 ? Math.max(readH - keptH - GAP, 0) : readH;

	return (
		<div className="group relative flex min-w-0 flex-1 flex-col items-center justify-end self-stretch">
			{/* Readout on hover or keyboard focus. It supplements the axis and the
			    table; it never holds the only copy of a value. */}
			<div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left whitespace-nowrap shadow-sm group-hover:block group-focus-within:block">
				<p className="text-[11px] font-semibold">
					{formatMonthYear(bucket.month)}
				</p>
				<p className="text-[11px] text-muted-foreground tabular-nums">
					{formatCount(bucket.read)} read · {formatCount(bucket.kept)} kept ·{" "}
					{formatRate(bucket.kept, bucket.read)}
				</p>
			</div>

			{annotate && read > 0 ? (
				<span className="mb-1.5 text-[11px] leading-none font-semibold whitespace-nowrap text-foreground tabular-nums">
					{formatRate(bucket.kept, bucket.read)} kept
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
				aria-label={`${formatMonthYear(bucket.month)}: ${formatCount(
					bucket.read,
				)} read, ${formatCount(bucket.kept)} kept`}
				className="absolute inset-0 cursor-default rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
		</div>
	);
}

export function SignalMeter({ stats }: { stats: PipelineStats }) {
	const { months } = stats;

	// Without buckets there is no shape to draw, and inventing one would make the
	// page lie. Drop the section instead.
	if (months.length < 2) {
		return null;
	}

	// Buckets whose counts failed to read are excluded from the scale and from
	// the keep-rate story rather than being treated as zeros.
	const top = axisTop(Math.max(...months.map((m) => m.read ?? 0)));
	// Three ticks — top, midpoint, baseline. They carry the values the columns
	// no longer print.
	const tickValues = [top, top / 2, 0];

	// The story's endpoints: the first and last months that actually read
	// something. Those two carry the direct labels and the caption.
	//
	// A month that kept nothing still scored — 0% is a reading, not a gap — so
	// only an unreadable count or an idle month is excluded. `read > 0` is what
	// keeps the rate and the multiplier out of a division by zero; `kept > 0`
	// was doing nothing but hiding the months the filter was strictest.
	const scored = months.filter(
		(m): m is MonthBucket & { read: number; kept: number } =>
			m.read !== null && m.kept !== null && m.read > 0,
	);
	const firstScored = scored.at(0);
	const lastScored = scored.at(-1);
	const annotated = new Set(
		[firstScored?.month, lastScored?.month].filter(Boolean),
	);

	// Stated, not implied. The direction is read off the data rather than
	// assumed, so a month where the filter loosens doesn't turn this into a lie.
	const caption =
		firstScored && lastScored && firstScored.month !== lastScored.month
			? `Keep rate ${
					lastScored.kept / lastScored.read <
					firstScored.kept / firstScored.read
						? "fell"
						: "rose"
				} from ${formatRate(firstScored.kept, firstScored.read)} in ${formatMonthYear(
					firstScored.month,
				)} to ${formatRate(
					lastScored.kept,
					lastScored.read,
				)} in ${formatMonthYear(lastScored.month)}, while the volume read each month ${volumePhrase(
					firstScored.read,
					lastScored.read,
				)}.`
			: null;

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
						Read vs. kept, by month
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
								{months.map((bucket) => (
									<MonthColumn
										key={bucket.month}
										bucket={bucket}
										top={top}
										annotate={annotated.has(bucket.month)}
									/>
								))}
							</div>
						</div>

						{/* Month band, outside the plot box so nothing is clipped by it.
						    Same flex geometry, so the labels stay under their columns. */}
						<div className="mt-3 flex gap-1.5 sm:gap-3">
							{months.map((bucket, i) => (
								<span
									key={bucket.month}
									className="min-w-0 flex-1 text-center text-[11px] leading-none text-muted-foreground"
								>
									{monthLabel(bucket.month, i === 0)}
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
									Month
								</th>
								<th scope="col" className="py-2 pr-4 text-right font-normal">
									Read
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
							{months.map((bucket) => (
								<tr key={bucket.month} className="border-b border-border/50">
									<th scope="row" className="py-2 pr-4 font-normal">
										{formatMonthYear(bucket.month)}
									</th>
									<td className="py-2 pr-4 text-right">
										{formatCount(bucket.read)}
									</td>
									<td className="py-2 pr-4 text-right">
										{formatCount(bucket.kept)}
									</td>
									<td className="py-2 text-right">
										{formatRate(bucket.kept, bucket.read)}
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
	const { articlesRead, entriesKept, sources, firstRun } = stats;

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
	// "1 in Infinity" is not a ratio. With nothing kept there is no
	// signal-to-noise to state, so the row is dropped rather than faked.
	if (entriesKept > 0) {
		rows.push([
			"Signal-to-noise",
			`1 in ${Math.round(articlesRead / entriesKept)}`,
		]);
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
			{rows.map(([label, value], index) => (
				<div
					key={label}
					className="flex items-baseline justify-between gap-4 py-3"
				>
					<dt className="text-sm text-muted-foreground">{label}</dt>
					{/* Only the ratio is coloured — it's the figure the whole page is
					    arguing for, and colouring one value in five marks it as the
					    headline number without turning the column into a rainbow. */}
					<dd
						className={
							index === 2
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
