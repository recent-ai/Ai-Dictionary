import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { LatestInsights } from "@/components/home/LatestInsights";
import { Newsletter } from "@/components/home/Newsletter";
import { type BlogPost, getPublicBlogPosts } from "@/lib/blog-data";
import { getPipelineStats, type PipelineStats } from "@/lib/pipeline-stats";

/** Regenerated hourly — the pipeline runs daily, so this is far more often than the data changes. */
export const revalidate = 3600;

/**
 * Homepage.
 *
 * Both fetches are best-effort. `getPublicBlogPosts` throws on a database error, and
 * the homepage is the one page that must never 500 — the hero and the meter
 * each degrade on their own if their data is missing, so a failure here costs a
 * section rather than the site.
 */
async function loadHomeData(): Promise<{
	stats: PipelineStats;
	posts: BlogPost[];
}> {
	const [stats, posts] = await Promise.all([
		getPipelineStats(),
		getPublicBlogPosts().catch((error) => {
			console.error("Homepage: failed to load posts", error);
			return [] as BlogPost[];
		}),
	]);

	return { stats, posts };
}

export default async function Home() {
	const { stats, posts } = await loadHomeData();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<HeroSection stats={stats} latestSlug={posts[0]?.slug} />
			<LatestInsights posts={posts} />
			<Newsletter />
			<Footer />
		</div>
	);
}
