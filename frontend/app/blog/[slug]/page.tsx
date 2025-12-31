import { AllContentBlock } from "@/types/content";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { ScrollProgress } from "@/components/scroll-progress";


export const BLOG_DATABASE: Record<string, AllContentBlock[]> = {}

/**
 * Props for the BlogPostPage component.
 * 
 * @property params - A Promise that resolves to route parameters for the dynamic blog post page.params are asynchronous to support streaming and server-side rendering optimizations.
 * @property params.slug - The URL slug that identifies which blog post to display.This value is extracted from the route path `/blog/[slug]`.
 */
interface PageProps{
  params:Promise<{ 
    slug:string;
  }>;
}
/**
 * Render the blog post page for a given route slug.
 *
 * @param params - Promise resolving to an object containing the route `slug`
 * @returns A React element that renders the post content for the specified `slug`, or a centered "404 - Blog Post Not Found" message when no post is found
 */
export default async function BlogPostPage({ params }: PageProps) {
  const {slug} = await params;
  const MOCK_DATA = BLOG_DATABASE[slug] || [];
  // If no data found for slug, you might want to handle 404 here

  //Extracting title block for breadcrumbs 
  const titleBlock = MOCK_DATA.find((b) => b.type === "title");
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
        {/* Passing an empty array triggers the "No content" if-statement */}
        <BlockRenderer blocks={MOCK_DATA} />
      </main>
    </div>
  );
}