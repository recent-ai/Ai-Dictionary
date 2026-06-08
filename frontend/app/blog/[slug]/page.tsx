import { BlockRenderer } from "@/components/blocks/block-renderer";
import { ScrollProgress } from "@/components/scroll-progress";
import { getBlogPostBySlug } from "@/lib/blog-data";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function BlogPostPage({ params }: PageProps) {
	const { slug } = await params;
	const post = await getBlogPostBySlug(slug);

	if (!post) {
		notFound();
	}

	const titleBlock = post.blocks.find(
		(block): block is Extract<typeof block, { type: "title" }> =>
			block.type === "title",
	);
	const postTitle = titleBlock?.data.content ?? "Blog Post";

	return (
		<div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary relative">
			<ScrollProgress />
			<main className="container mx-auto px-4 pb-20 max-w-4xl">
				<nav className="flex items-center gap-2 text-sm text-muted-foreground py-8 overflow-x-auto whitespace-nowrap">
					<Link
						href="/"
						className="hover:text-primary transition-colors flex items-center gap-1"
					>
						<Home className="w-3.5 h-3.5" /> Home
					</Link>
					<ChevronRight className="w-4 h-4" />
					<Link href="/blog" className="hover:text-primary transition-colors">
						Blog
					</Link>
					<ChevronRight className="w-4 h-4" />
					<span className="text-foreground font-medium max-w-[250px] truncate">
						{postTitle}
					</span>
				</nav>
				<BlockRenderer blocks={post.blocks} />
			</main>
		</div>
	);
}
