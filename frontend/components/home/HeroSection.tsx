import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PipelineReadout, SignalMeter } from "@/components/home/SignalMeter";
import { Button } from "@/components/ui/button";
import type { PipelineStats } from "@/lib/pipeline-stats";

/**
 * Landing masthead.
 *
 * Two columns rather than one. The headline previously sat alone in the left
 * third of a 1200px page, leaving the right two thirds as empty surface; the
 * all-time figures now occupy it as a readout. That also frees the subline to
 * be prose instead of a sentence with numbers wedged into it — the numbers are
 * easier to read in a column than mid-paragraph, and they stop being repeated.
 *
 * Left-aligned, not centred, so the headline, the readout, the meter and the
 * entry list all share one margin running the length of the page. That reads as
 * an edition; centred type reads as an ad.
 *
 * Both actions are real links. They were previously bare <Button> elements with
 * no href and no handler, so the primary call to action on the site did nothing.
 */
export function HeroSection({
	stats,
	latestSlug,
}: {
	stats: PipelineStats;
	/** Newest entry, so "Read the latest" goes somewhere real. */
	latestSlug?: string;
}) {
	return (
		<section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24">
			{/* The wash sits above the background and below everything else. It's the
			    reason the top of the page has a temperature rather than being a white
			    or black rectangle — two very weak radials, no visible edge. */}
			<div
				className="ambient-wash pointer-events-none absolute inset-x-0 top-0 h-[38rem]"
				aria-hidden="true"
			/>
			<div className="relative z-10 container mx-auto max-w-[1200px] px-4 sm:px-6">
				<div className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 items-end gap-10 duration-700 ease-out lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
					<div>
						{/* The dot is the page's first mark of colour and the smallest one
						    it can be: a status light on a line that describes a running
						    process. It reads as "this is live" without a badge, a pill or
						    the word "live". Teal rather than the brand indigo — the swash
						    below is indigo, and two indigo marks stacked four lines apart
						    read as one repeated thing rather than two different ones. */}
						<p className="flex items-center gap-2.5 text-sm text-muted-foreground">
							<span
								className="relative flex h-2 w-2 shrink-0"
								aria-hidden="true"
							>
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hue-3 opacity-60 motion-reduce:animate-none" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-hue-3" />
							</span>
							Daily AI intelligence, assembled by pipeline
						</p>

						<h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tighter sm:text-6xl md:text-7xl">
							The{" "}
							{/* "Signal" in teal and "Noise" swashed in indigo: the headline is
							    a contrast between two things, so the two words are the two
							    hues. Previously both were grey-on-black, which stated the
							    contrast in words while showing none of it. */}
							<span className="text-hue-3">Signal</span>
							<br />
							<span className="mr-2 font-serif text-4xl text-muted-foreground italic sm:text-5xl md:text-6xl">
								in the
							</span>
							<span className="relative inline-block">
								Noise.
								{/* `bg-brand`, not a hardcoded `indigo-500`: at 25% on a black
								    surface indigo-500 is almost invisible, and the token
								    already switches to the lighter step in dark mode. */}
								<span
									className="absolute -bottom-1 left-0 -z-10 h-3 w-full -rotate-1 bg-brand/25"
									aria-hidden="true"
								/>
							</span>
						</h1>

						<p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
							Every AI source we can find, read daily, deduplicated by
							embedding, and rewritten in plain language. Most of it
							doesn&rsquo;t survive the filter &mdash; that&rsquo;s the point.
						</p>

						<div className="mt-9 flex flex-wrap gap-3">
							<Button
								asChild
								size="lg"
								className="group h-12 rounded-full bg-foreground px-6 text-base text-background hover:bg-foreground/90"
							>
								<Link href={latestSlug ? `/blog/${latestSlug}` : "/blog"}>
									Read the latest
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="h-12 rounded-full border-border px-6 text-base hover:bg-secondary/50"
							>
								<Link href="/blog">Browse the archive</Link>
							</Button>
						</div>
					</div>

					{/* Bottom-aligned in the grid so the readout's last rule lands near
					    the buttons rather than floating above them. */}
					<PipelineReadout stats={stats} />
				</div>

				{/* A gradient hairline instead of a flat border: it's the widest single
				    element on the page, so it's the cheapest place to put colour that
				    reads at a glance without competing with any text. */}
				<div className="mt-14 md:mt-20">
					<div className="rule-accent h-px w-full" aria-hidden="true" />
					<div className="pt-10">
						<SignalMeter stats={stats} />
					</div>
				</div>
			</div>
		</section>
	);
}
