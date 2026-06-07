import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function BlogListingLoading() {
	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-20">
			{/* Hero / Spotlight Section */}
			<section className="relative z-10 w-full py-12 md:py-16 px-6 md:px-12 border-b border-border/40 bg-background/50 backdrop-blur-sm">
				<div className="container mx-auto max-w-7xl">
					<div className="flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
						<div className="space-y-2">
							<h1 className="text-4xl md:text-5xl font-black tracking-tighter pb-2">
								The Knowledge Base
							</h1>
							<Skeleton className="h-6 w-96 max-w-xl" />
						</div>
					</div>
				</div>
			</section>

			<main className="container mx-auto px-6 md:px-12 z-10 relative mt-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card
							key={i}
							className="h-full flex flex-col border-border/40 bg-card/10 backdrop-blur-md overflow-hidden"
						>
							{/* Image Skeleton */}
							<Skeleton className="h-56 w-full" />

							<CardHeader className="space-y-3 relative">
								<div className="flex gap-2">
									<Skeleton className="h-4 w-12" />
									<Skeleton className="h-4 w-12" />
								</div>
								<Skeleton className="h-6 w-full" />
								<Skeleton className="h-6 w-3/4" />
							</CardHeader>

							<CardContent className="grow space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</CardContent>

							<CardFooter className="flex items-center justify-between border-t border-border/10 pt-4 mt-auto">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
							</CardFooter>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
