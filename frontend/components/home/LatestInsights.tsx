import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog-data";
import { readingTime, sanitizeArticleMarkdown } from "@/lib/markdown";

/**
 * The latest entries.
 *
 * Previously this mapped over [1,2,3,4,5,6] and rendered the same hardcoded
 * headline six times, each above a 220px empty box holding a newspaper icon —
 * so the homepage repeated one fake story six times and showed no real content
 * at all. It now renders actual entries, and the image placeholder is gone:
 * these posts rarely have images, and a grey rectangle contributes nothing that
 * the headline doesn't already say.
 *
 * A list rather than a card grid, because every entry here is the same kind of
 * thing. Cards imply the items are independent objects worth separate frames;
 * a ruled list says "these are ranked, read them in order", which is what a
 * daily brief actually is.
 */

type Entry = {
	slug: string;
	title: string;
	summary: string;
	date: string;
	difficulty: string | null;
	readingTime: string | null;
};

const DIFFICULTY_STEPS = ["beginner", "intermediate", "advanced"];

function toEntry(post: BlogPost): Entry {
	const title = post.blocks.find((block) => block.type === "title");
	const summary = post.blocks.find((block) => block.type === "summary");
	const body = post.blocks.find((block) => block.type === "explanation");
	const titleData = title?.type === "title" ? title.data : undefined;

	// Difficulty is present on about a quarter of the corpus. Where it's absent
	// the badge is dropped rather than printing "beginner" as though the pipeline
	// had graded it — same rule the archive follows.
	const rawDifficulty = titleData?.difficulty?.toLowerCase().trim();
	const graded =
		rawDifficulty === "intermediate" || rawDifficulty === "advanced"
			? rawDifficulty
			: null;

	return {
		slug: post.slug,
		title: titleData?.content ?? post.metadata?.title ?? "Untitled",
		summary: summary?.type === "summary" ? summary.data.content : "",
		date: titleData?.date ?? "",
		difficulty: graded,
		// Same reasoning, one step further: `estimated_time` is absent on most
		// entries and `blog-data` substitutes a constant "5 min read", so the
		// figure read as measured while never varying. Counted from the body.
		readingTime:
			body?.type === "explanation"
				? readingTime(sanitizeArticleMarkdown(body.data.content))
				: null,
	};
}

/**
 * Ordinal difficulty as filled bars — rank you can see without reading.
 *
 * The three steps run through three of the categorical slots in ascending order
 * — teal, amber, rose — so the bars encode level twice: how many are filled, and
 * how far along a cool-to-warm run the last filled one sits. That's the same
 * convention as a signal meter or a heat scale, so it needs no legend. The
 * written label sits next to it regardless, so nothing depends on the colour.
 */
const DIFFICULTY_FILL = ["bg-hue-3", "bg-hue-2", "bg-hue-4"];

function DifficultyBars({ difficulty }: { difficulty: string | null }) {
	if (!difficulty) {
		return null;
	}
	const level = DIFFICULTY_STEPS.indexOf(difficulty.toLowerCase().trim()) + 1;
	if (level === 0) {
		return null;
	}

	return (
		<span className="inline-flex items-center gap-1.5">
			<span className="flex items-end gap-[2px]" aria-hidden="true">
				{DIFFICULTY_STEPS.map((step, index) => (
					<span
						key={step}
						className={
							index < level
								? `w-[3px] ${DIFFICULTY_FILL[level - 1]}`
								: "w-[3px] bg-border"
						}
						style={{ height: `${5 + index * 3}px` }}
					/>
				))}
			</span>
			<span className="capitalize">{difficulty}</span>
		</span>
	);
}

export function LatestInsights({ posts }: { posts: BlogPost[] }) {
	const entries = posts.slice(0, 6).map(toEntry);

	if (entries.length === 0) {
		return null;
	}

	return (
		<section className="border-t border-border/40 py-16 md:py-20">
			<div className="container mx-auto max-w-[1200px] px-4 sm:px-6">
				<div className="flex items-baseline justify-between gap-6">
					<h2 className="flex items-baseline gap-3 text-3xl font-bold tracking-tight">
						<span
							className="h-5 w-1 shrink-0 translate-y-0.5 rounded-full bg-hue-4"
							aria-hidden="true"
						/>
						Latest
					</h2>
					<Link
						href="/blog"
						className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
					>
						View archive
						<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>

				<ol className="mt-8">
					{entries.map((entry, index) => (
						<li key={entry.slug}>
							<Link
								href={`/blog/${entry.slug}`}
								className="group -mx-4 grid grid-cols-[2.5rem_1fr] items-baseline gap-x-5 gap-y-2 border-t border-border/60 px-4 py-6 transition-colors hover:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:grid-cols-[3rem_1fr_auto]"
							>
								{/* The rank goes accent-coloured under the cursor. It's the
								    row's own index, so colouring it on hover marks position
								    without adding a permanent column of colour. */}
								<span className="text-sm text-muted-foreground transition-colors group-hover:text-brand tabular-nums">
									{String(index + 1).padStart(2, "0")}
								</span>

								<div className="min-w-0">
									<h3 className="text-lg leading-snug font-bold transition-colors group-hover:text-brand md:text-xl">
										{entry.title}
									</h3>
									{entry.summary ? (
										<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
											{entry.summary}
										</p>
									) : null}
									<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:hidden">
										<DifficultyBars difficulty={entry.difficulty} />
										{entry.date ? <span>{entry.date}</span> : null}
									</div>
								</div>

								{/* Same metadata, moved to its own column once there's room, so
								    the values line up vertically down the list. */}
								<div className="hidden shrink-0 flex-col items-end gap-1.5 text-xs text-muted-foreground sm:flex">
									<DifficultyBars difficulty={entry.difficulty} />
									{entry.date ? <span>{entry.date}</span> : null}
									{entry.readingTime ? <span>{entry.readingTime}</span> : null}
								</div>
							</Link>
						</li>
					))}
				</ol>
				<div className="border-t border-border/60" />
			</div>
		</section>
	);
}
