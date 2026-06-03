import type { AllContentBlock, TitleBlock } from "@/types/content";
import { createClient } from "@/lib/supabase/server";

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

	return new Intl.DateTimeFormat("en", {
		month: "long",
		day: "numeric",
		year: "numeric",
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
				date: asString(title.date, formatDate(metadata?.approveddate)),
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

export async function getBlogPosts() {
	const supabase = await createClient();

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
		.order("postid", { ascending: false });

	if (error) {
		console.error("Failed to fetch blog posts", error);
		return [];
	}

	return (data ?? [])
		.map((row) => mapRowToBlogPost(row))
		.filter((post): post is BlogPost => post !== null);
}

export async function getBlogPostBySlug(slug: string) {
	const posts = await getBlogPosts();
	return posts.find((post) => post.slug === slug) ?? null;
}
