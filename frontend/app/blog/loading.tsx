import { Skeleton } from "@/components/ui/skeleton";

/**
 * Archive placeholder.
 *
 * Mirrors the real page's geometry — masthead, readout column, distribution
 * strip, filter row, ruled list — so the layout doesn't jump when the entries
 * arrive. The headline is real text rather than a grey bar, because it's known
 * before the data is and there's no reason to withhold it.
 */
export default function BlogListingLoading() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<main className="container mx-auto max-w-[1200px] px-4 pt-14 pb-20 sm:px-6 md:pt-20">
				<header className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
					<div>
						<p className="text-sm text-muted-foreground">
							Everything that survived the filter
						</p>
						<h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-tighter sm:text-6xl md:text-7xl">
							The Archive
						</h1>
						<div className="mt-7 max-w-xl space-y-2">
							<Skeleton className="h-5 w-full" />
							<Skeleton className="h-5 w-4/5" />
						</div>
					</div>

					<div className="divide-y divide-border/60 border-y border-border/60">
						{["entries", "sources", "covering"].map((row) => (
							<div
								key={row}
								className="flex items-baseline justify-between gap-4 py-3"
							>
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-14" />
							</div>
						))}
					</div>
				</header>

				<section className="mt-14 border-t border-border/60 pt-8 md:mt-20">
					<div className="flex items-baseline justify-between gap-6">
						<h2 className="text-sm font-medium">Published by month</h2>
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="mt-5 flex items-end gap-1.5">
						{[24, 56, 38, 14, 46, 20].map((height) => (
							<div
								key={height}
								className="flex w-14 flex-col items-center gap-1.5"
							>
								<Skeleton className="h-3 w-5" />
								<div className="flex h-14 w-full items-end">
									<Skeleton className="w-full" style={{ height }} />
								</div>
								<Skeleton className="mt-1 h-3 w-10" />
							</div>
						))}
					</div>
				</section>

				<section className="mt-12">
					<div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
						<Skeleton className="h-10 w-full max-w-sm rounded-full" />
						<div className="flex flex-wrap gap-2">
							{[88, 108, 96, 84].map((width) => (
								<Skeleton
									key={width}
									className="h-8 rounded-full"
									style={{ width }}
								/>
							))}
						</div>
					</div>

					<div className="mt-8 flex items-baseline justify-between border-b border-border py-3">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-3 w-6" />
					</div>

					{Array.from({ length: 8 }, (_, index) => index).map((row) => (
						<div
							key={row}
							className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-border/60 py-5 sm:grid-cols-[4.5rem_1fr_9rem]"
						>
							<Skeleton className="hidden h-4 w-14 sm:block" />
							<div className="space-y-2">
								<Skeleton className="h-5 w-11/12" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</div>
							<div className="hidden flex-col items-end gap-1.5 sm:flex">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-3 w-14" />
							</div>
						</div>
					))}
				</section>
			</main>
		</div>
	);
}
