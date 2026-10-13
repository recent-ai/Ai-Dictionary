import { ScrollProgress } from "@/components/scroll-progress";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Article placeholder.
 *
 * Mirrors the real page: breadcrumb, masthead with the contents rail beside it,
 * the lede rule, then body paragraphs at the same measure — so nothing shifts
 * horizontally when the article lands.
 */
export default function BlogPostLoading() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<ScrollProgress />
			<main className="container mx-auto max-w-[1200px] px-4 pt-12 pb-20 sm:px-6 md:pt-16">
				<Skeleton className="h-4 w-24" />

				<div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
					<div className="max-w-3xl">
						<Skeleton className="h-4 w-32" />
						<div className="mt-5 space-y-3">
							<Skeleton className="h-11 w-full" />
							<Skeleton className="h-11 w-4/5" />
						</div>
						<Skeleton className="mt-6 h-4 w-56" />
						<div className="mt-8 space-y-3 border-l-2 border-border pl-5">
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-11/12" />
							<Skeleton className="h-6 w-2/3" />
						</div>
					</div>

					<div className="hidden lg:block">
						<Skeleton className="h-3 w-20" />
						<div className="mt-4 space-y-3 border-l border-border pl-4">
							{[90, 70, 80, 60, 75].map((width) => (
								<Skeleton
									key={width}
									className="h-4"
									style={{ width: `${width}%` }}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="mt-12 border-t border-border/60 pt-10 md:mt-16">
					<div className="max-w-3xl space-y-10">
						{Array.from({ length: 4 }, (_, index) => index).map((section) => (
							<div key={section} className="space-y-3">
								{section > 0 ? <Skeleton className="h-8 w-1/2" /> : null}
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-11/12" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
