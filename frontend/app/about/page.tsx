import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PipelineReadout } from "@/components/home/SignalMeter";
import { getPipelineStats } from "@/lib/pipeline-stats";

/**
 * About.
 *
 * The previous version of this route rendered a single absolutely-positioned
 * gradient div and no content at all — a hardcoded `gray-950` slab that ignored
 * the theme, so in light mode the page was a black rectangle with nothing on it.
 *
 * It's now the same edition layout as the landing page and the archive: eyebrow,
 * display headline, a readout column on the right, then a ruled list. The
 * pipeline stages are numbered because they run in order and each one only sees
 * what the one above it passed on — that sequence is the whole explanation, so
 * the numbering carries it rather than a paragraph.
 */

/** Same hourly cadence as every other page that reads the pipeline counts. */
export const revalidate = 3600;

export const metadata = {
	title: "About",
	description:
		"How the archive is assembled: what the pipeline reads, what it throws away, and what it does to the rest.",
};

/**
 * The stages, described as what the code does rather than as capabilities.
 *
 * Grounded in the ingestion adapters, the embedding-based deduplication and the
 * generation step — not in claims the pipeline doesn't make.
 *
 * Each stage gets one of the four categorical slots, in order. This is the one
 * place on the site where the whole palette is visible at once and where it's
 * doing real work: four discrete stages, four hues, so the section reads as a
 * sequence of distinct things instead of four paragraphs. The ordinal and the
 * title carry the identity; the hue is redundant with both.
 */
const STAGES: Array<{
	title: string;
	body: string;
	hue: string;
	rule: string;
}> = [
	{
		title: "Collect",
		hue: "text-hue-1",
		rule: "bg-hue-1",
		body: "One adapter per source, each normalising its own feed — RSS, JSON APIs, scraped indexes — into a single raw record. New sources are new adapters, so adding one doesn't touch anything downstream.",
	},
	{
		title: "Deduplicate",
		hue: "text-hue-2",
		rule: "bg-hue-2",
		body: "The same story reaches us from a dozen outlets within an hour of itself. Each item is embedded and compared against what is already stored, so near-identical coverage collapses to one entry instead of thirteen.",
	},
	{
		title: "Rewrite",
		hue: "text-hue-3",
		rule: "bg-hue-3",
		body: "What survives is summarised and rewritten in plain language, with the jargon expanded rather than assumed. The source stays on the entry, so the original is always one click away.",
	},
	{
		title: "Publish",
		hue: "text-hue-4",
		rule: "bg-hue-4",
		body: "Entries land in the archive newest-first and stay there. Nothing is removed once published — the record of what the pipeline thought was worth keeping is part of the point.",
	},
];

export default async function AboutPage() {
	const stats = await getPipelineStats();

	return (
		<div className="relative min-h-screen bg-background text-foreground">
			<div
				className="ambient-wash pointer-events-none absolute inset-x-0 top-0 h-[30rem]"
				aria-hidden="true"
			/>
			<main className="relative container mx-auto max-w-[1200px] px-4 pt-14 pb-20 sm:px-6 md:pt-20">
				<header className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
					<div>
						<p className="flex items-center gap-2.5 text-sm text-muted-foreground">
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
								aria-hidden="true"
							/>
							Colophon
						</p>
						<h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tighter sm:text-6xl md:text-7xl">
							How this{" "}
							{/* Painted first, word on top — the same document-order trick the
							    landing page and the archive use, because a negative z-index
							    needs an ancestor stacking context that a plain header
							    doesn't open. */}
							<span className="relative inline-block">
								<span
									className="absolute right-0 -bottom-1 left-0 h-3 -rotate-1 bg-brand/25"
									aria-hidden="true"
								/>
								<span className="relative">is made.</span>
							</span>
						</h1>
						<p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
							Most AI coverage is the same twelve stories rewritten by everyone
							at once. This is an attempt to read all of it on a schedule, throw
							away the duplicates, and keep the residue in one place.
						</p>
					</div>

					<PipelineReadout stats={stats} />
				</header>

				<section className="mt-14 md:mt-20">
					<h2 className="text-sm tracking-widest text-muted-foreground uppercase">
						The pipeline
					</h2>

					<ol className="mt-6">
						{STAGES.map((stage, index) => (
							<li
								key={stage.title}
								className="group relative grid grid-cols-[2.5rem_1fr] items-baseline gap-x-5 gap-y-2 border-t border-border/60 py-6 sm:grid-cols-[3rem_1fr]"
							>
								{/* The stage's hue as a left edge, revealed on hover. At rest
								    the ordinal alone carries it, so four coloured bars aren't
								    all shouting at once. */}
								<span
									className={`absolute top-0 bottom-0 -left-4 w-[3px] scale-y-0 rounded-full transition-transform duration-200 group-hover:scale-y-100 ${stage.rule}`}
									aria-hidden="true"
								/>
								{/* The step number is the one coloured thing in the list — it
								    marks the sequence, which is what the section is about. The
								    titles stay in ink. */}
								<span
									className={`text-sm font-semibold tabular-nums ${stage.hue}`}
								>
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="max-w-2xl min-w-0">
									<h3 className="text-lg leading-snug font-bold md:text-xl">
										{stage.title}
									</h3>
									<p className="mt-2 leading-relaxed text-muted-foreground">
										{stage.body}
									</p>
								</div>
							</li>
						))}
					</ol>
					<div className="border-t border-border/60" />
				</section>

				<section className="mt-14 md:mt-20">
					{/* Amber wash and an amber top edge. This is the caveat section — the
					    one place on the site that's asking you to be careful — so it gets
					    the warning-adjacent hue rather than the neutral grey it had. Not
					    the red slot: nothing here is an error, and rose is spent on the
					    fourth categorical identity. */}
					<div className="relative overflow-hidden rounded-2xl border border-border bg-hue-2-wash p-8 md:p-10">
						<span
							className="absolute inset-x-0 top-0 h-0.5 bg-hue-2/70"
							aria-hidden="true"
						/>
						<h2 className="text-2xl font-bold tracking-tight md:text-3xl">
							What this isn&rsquo;t
						</h2>
						<p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
							Every entry is machine-summarised from a source article, and the
							summary is not a substitute for reading it. The pipeline has no
							opinion about whether a story is true &mdash; only about whether
							it has already seen it. Follow the source link before you rely on
							anything here.
						</p>
						<Link
							href="/blog"
							className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand/80"
						>
							Browse the archive
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
