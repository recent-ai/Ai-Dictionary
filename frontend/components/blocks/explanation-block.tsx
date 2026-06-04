"use client";

import { ExplanationBlock } from "@/types/content";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = ExplanationBlock["data"];

export function ExplanationComponent({ content }: Props) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
			className="prose prose-lg dark:prose-invert max-w-none mb-16"
		>
			<h2 className="text-3xl font-bold mb-6 tracking-tight">
				Deep Dive {/*Generalized Now*/}
			</h2>
			<div className="prose prose-neutral dark:prose-invert max-w-none">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
			</div>
		</motion.section>
	);
}
