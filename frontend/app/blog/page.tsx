import { TriangleAlert } from "lucide-react";
import { ArchiveIndex } from "@/components/archive/ArchiveIndex";
import { Footer } from "@/components/Footer";
import { buildArchive } from "@/lib/archive";
import { getPublicBlogPosts } from "@/lib/blog-data";

/**
 * The archive index.
 *
 * This was a three-column card grid over all 244 entries, each card leading with
 * a 224px image well. No post in the corpus has an image, so every one of those
 * wells rendered an empty grey rectangle with a book icon in it — 244 of them,
 * making the page 47,000 pixels tall and carrying no information at all.
 *
 * It's a list now, because that's what an archive is: a large set of the same
 * kind of thing, read by scanning. Grouped by month, ruled rather than boxed,
 * with the distribution and the source counts at the top so the shape of the
 * collection is visible before you start scrolling it.
 */

/** Matches the homepage: the pipeline runs daily, this regenerates hourly. */
export const revalidate = 3600;

export const metadata = {
	title: "Archive",
	description:
		"Every entry that survived the filter, grouped by month and searchable.",
};

export default async function BlogListingPage() {
	let archive: ReturnType<typeof buildArchive> | null = null;
	let loadError: string | null = null;

	try {
		// The public client, not the cookie-aware one: reading cookies would force
		// this route to render per-request, and the archive is the same for
		// everyone. This is what keeps the page static.
		archive = buildArchive(await getPublicBlogPosts());
	} catch (error) {
		loadError =
			error instanceof Error ? error.message : "Unable to load blog posts.";
	}

	return (
		<div className="relative min-h-screen bg-background text-foreground">
			{/* Same wash as the landing hero, so the archive reads as the same
			    publication rather than a different template. `overflow-hidden` on the
			    wrapper would clip the sticky month headers, so the wash is clipped by
			    its own fixed height instead. */}
			<div
				className="ambient-wash pointer-events-none absolute inset-x-0 top-0 h-[30rem]"
				aria-hidden="true"
			/>
			<main className="relative container mx-auto max-w-[1200px] px-4 pt-14 pb-20 sm:px-6 md:pt-20">
				<header className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
					<div>
						<p className="flex items-center gap-2.5 text-sm text-muted-foreground">
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full bg-hue-2"
								aria-hidden="true"
							/>
							Everything that survived the filter
						</p>
						<h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tighter sm:text-6xl md:text-7xl">
							The{" "}
							{/* The swash is painted first and the word sits on top of it in
							    document order. The hero does the same thing with `-z-10`,
							    which works there only because its framer-motion wrapper
							    happens to open a stacking context — without one, a negative
							    z-index puts the highlight behind the page background and it
							    disappears entirely. */}
							<span className="relative inline-block">
								<span
									className="absolute inset-x-0 -bottom-1 h-3 -rotate-1 bg-brand/25"
									aria-hidden="true"
								/>
								<span className="relative">Archive</span>
							</span>
						</h1>
						<p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
							Every entry the pipeline has kept, newest first. The bars are the
							monthly count &mdash; click one to jump to that month, or narrow
							the list by source and search.
						</p>
					</div>

					{archive && archive.total > 0 ? (
						<dl className="divide-y divide-border/60 border-y border-border/60">
							<div className="flex items-baseline justify-between gap-4 py-3">
								<dt className="text-sm text-muted-foreground">Entries</dt>
								<dd className="text-lg font-semibold">{archive.total}</dd>
							</div>
							<div className="flex items-baseline justify-between gap-4 py-3">
								<dt className="text-sm text-muted-foreground">Sources</dt>
								<dd className="text-lg font-semibold">
									{archive.sources.length}
								</dd>
							</div>
							{archive.span ? (
								<div className="flex items-baseline justify-between gap-4 py-3">
									<dt className="text-sm text-muted-foreground">Covering</dt>
									<dd className="text-right text-lg font-semibold">
										{archive.span.from === archive.span.to
											? archive.span.from
											: `${archive.span.from} — ${archive.span.to}`}
									</dd>
								</div>
							) : null}
						</dl>
					) : null}
				</header>

				<div className="mt-10 md:mt-16">
					{loadError ? (
						<div
							role="alert"
							aria-live="assertive"
							className="flex max-w-2xl gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
						>
							<TriangleAlert
								className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
								aria-hidden="true"
							/>
							<div>
								<h2 className="text-lg font-bold">Archive unavailable</h2>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									The entries could not be loaded from the database. This is a
									service fault, not an empty archive &mdash; the posts are
									still there.
								</p>
								<p className="mt-3 font-mono text-xs text-destructive/80">
									{loadError}
								</p>
							</div>
						</div>
					) : archive && archive.total > 0 ? (
						<ArchiveIndex archive={archive} />
					) : (
						<div className="border-t border-border/60 py-24 text-center">
							<p className="text-lg font-bold">The archive is empty.</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Nothing has cleared the filter yet. Entries appear here as the
								pipeline approves them.
							</p>
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}
