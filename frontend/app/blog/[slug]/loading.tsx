import { Skeleton } from "@/components/ui/skeleton";
import { ScrollProgress } from "@/components/scroll-progress";

export default function BlogPostLoading() {
	return (
		<div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary relative">
			<ScrollProgress />
			<main className="container mx-auto px-4 pb-20 max-w-4xl">
				{/* Navigation Bar Skeleton */}
				<nav className="flex items-center gap-2 text-sm text-muted-foreground py-8 overflow-x-auto whitespace-nowrap">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-48" />
				</nav>

				{/* Content Skeleton */}
				<div className="space-y-8">
					{/* Title Section */}
					<div className="space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-6 w-3/4" />
					</div>

					{/* Meta Information */}
					<div className="flex gap-4">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-6 w-20" />
					</div>

					{/* Content Blocks */}
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-3">
							{i % 3 === 0 && <Skeleton className="h-8 w-1/2" />}
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							{i % 2 === 0 && <Skeleton className="h-40 w-full mt-4" />}
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
