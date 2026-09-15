import { cache } from "react";
import { parseDisplayDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { AllContentBlock, TitleBlock } from "@/types/content";

type PostMetadata = {
	title: string | null;
	source: string | null;
	upload_date: string | null;
	approveddate: string | null;
	likescount: number | null;
};

type PostContentPayload = {
	title?: Partial<TitleBlock["data"]>;
	summary?: string;
	description?: string;
	slug?: string;
	generated_image?: string | null;
};

export type BlogPost = {
	postid: string;
	slug: string;
	metadata: PostMetadata | null;
	content: PostContentPayload;
	blocks: AllContentBlock[];
};

function isPostContentPayload(value: unknown): value is PostContentPayload {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" && value.trim() ? value : fallback;
}

function formatDate(value?: string | null) {
	if (!value) {
		return "Unknown Date";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	// Pinned to UTC. Everything downstream — `parseDisplayDate`, and the month
	// and day labels in the archive — reads this string back as UTC, so
	// formatting it in the server's zone would shift entries a day either way
	// depending on where the build ran.
	return new Intl.DateTimeFormat("en", {
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

function makeBlocks(
	content: PostContentPayload,
	metadata: PostMetadata | null,
): AllContentBlock[] {
	const title = content.title ?? {};
	const postTitle = asString(title.content, metadata?.title ?? "Untitled Post");
	const imageUrl = asString(content.generated_image, "");

	const blocks: AllContentBlock[] = [
		{
			id: "title",
			type: "title",
			data: {
				content: postTitle,
				// Normalise, don't just fall back. The generator writes `date` in
				// whatever shape the source used, so raw ISO strings ("2026-07-12")
				// were rendering next to formatted ones ("April 23, 2026") in the
				// same list. formatDate passes through anything it can't parse.
				date: formatDate(asString(title.date, metadata?.approveddate ?? "")),
				tags: Array.isArray(title.tags) ? title.tags : [],
				difficulty: title.difficulty ?? "beginner",
				author: asString(title.author, "AI Dictionary Bot"),
				estimated_time: asString(title.estimated_time, "5 min read"),
			},
		},
		{
			id: "summary",
			type: "summary",
			data: {
				content: asString(content.summary, "No summary available."),
			},
		},
	];

	if (imageUrl) {
		blocks.push({
			id: "image",
			type: "image",
			data: {
				url: imageUrl,
				caption: postTitle,
				alt: postTitle,
			},
		});
	}

	blocks.push({
		id: "description",
		type: "explanation",
		data: {
			content: asString(content.description, "No description available."),
		},
	});

	return blocks;
}

function mapRowToBlogPost(row: {
	postid: string;
	content: unknown;
	posts: PostMetadata | PostMetadata[] | null;
}): BlogPost | null {
	if (!isPostContentPayload(row.content)) {
		return null;
	}

	const metadata = Array.isArray(row.posts) ? row.posts[0] : row.posts;
	const slug = asString(row.content.slug, row.postid);

	return {
		postid: row.postid,
		slug,
		metadata,
		content: row.content,
		blocks: makeBlocks(row.content, metadata),
	};
}

/** Either Supabase client — the cookie-aware one or the public read-only one. */
type PostsClient =
	| Awaited<ReturnType<typeof createClient>>
	| ReturnType<typeof createStaticClient>;

/**
 * Every published post.
 *
 * This pages deliberately. PostgREST enforces a server-side ceiling of 1000
 * rows per response and truncates past it without saying so, and the corpus is
 * already 244 and growing — an unpaged query works right up until it silently
 * starts dropping the oldest quarter of the archive.
 */
async function queryBlogPosts(supabase: PostsClient): Promise<BlogPost[]> {
	const PAGE = 1000;
	const MAX_PAGES = 50; // ~50k posts; a backstop, not an expected bound.
	const posts: BlogPost[] = [];

	for (let page = 0; page < MAX_PAGES; page++) {
		const from = page * PAGE;
		const { data, error } = await supabase
			.from("post_content")
			.select(
				`
				postid,
				content,
				posts (
					title,
					source,
					upload_date,
					approveddate,
					likescount
				)
			`,
			)
			.eq("isoldpost", false)
			.order("postid", { ascending: false })
			.range(from, from + PAGE - 1);

		if (error) {
			console.error("Failed to fetch blog posts", error);
			throw new Error("Unable to load blog posts.");
		}

		for (const row of data ?? []) {
			const post = mapRowToBlogPost(row);
			if (post !== null) {
				posts.push(post);
			}
		}

		if (!data || data.length < PAGE) {
			return posts;
		}
	}

	console.warn("Blog posts hit the page ceiling — the list may be truncated.");
	return posts;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
	return queryBlogPosts(await createClient());
}

/**
 * Same posts, fetched without reading cookies.
 *
 * Reading `cookies()` forces a route to render per-request. The post list is
 * the same for everyone, so pages that only display it use this and stay
 * statically generated with ISR.
 */
export const getPublicBlogPosts = cache(async (): Promise<BlogPost[]> => {
	return queryBlogPosts(createStaticClient());
});

export async function getBlogPostBySlug(slug: string) {
	const posts = await getBlogPosts();
	return posts.find((post) => post.slug === slug) ?? null;
}

/**
 * One article, plus the entries either side of it.
 *
 * The neighbours come from the same order the archive uses — by publication
 * date, newest first — not the `postid` order the query returns, so "older" and
 * "newer" agree with the list you clicked through from. `getPublicBlogPosts` is
 * memoised for the render pass, so asking for the article and its neighbours
 * costs one query, not three.
 */
export async function getPublicArticle(slug: string): Promise<{
	post: BlogPost;
	newer: BlogPost | null;
	older: BlogPost | null;
} | null> {
	const posts = await getPublicBlogPosts();

	// Same key and direction as `buildArchive`: newest first, undated last.
	const ordered = posts
		.map((post) => {
			const titleBlock = post.blocks.find((block) => block.type === "title");
			const date = titleBlock?.type === "title" ? titleBlock.data.date : "";
			return { post, time: parseDisplayDate(date) };
		})
		.sort((a, b) => (b.time ?? -Infinity) - (a.time ?? -Infinity))
		.map((entry) => entry.post);

	const index = ordered.findIndex((post) => post.slug === slug);
	if (index === -1) {
		return null;
	}

	// Newest first, so the preceding entry is the newer one.
	return {
		post: ordered[index],
		newer: ordered[index - 1] ?? null,
		older: ordered[index + 1] ?? null,
	};
}
