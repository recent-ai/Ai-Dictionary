"use client";

import { ExplanationBlock } from "@/types/content";
import { motion } from "framer-motion";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = ExplanationBlock["data"] & { title?: string };

export function ExplanationComponent({ content, title = "Deep Dive" }: Props) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
			className="prose prose-lg prose-neutral dark:prose-invert max-w-none mb-16"
		>
			<h2 className="text-3xl font-bold mb-6 tracking-tight">{title}</h2>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					img: ({ src, alt }) => {
						if (!src || typeof src !== "string") return null;
						return (
							<Image
								src={src}
								alt={alt ?? ""}
								width={800}
								height={400}
								className="rounded-lg my-4"
							/>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</motion.section>
	);
}
