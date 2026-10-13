"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/**
 * Contents rail, with the current section marked.
 *
 * Worth building: 239 of the 244 articles carry headings, a median of nine each,
 * so these are long enough to get lost in and structured enough to navigate.
 *
 * The active heading is the last one whose top has passed the reading line —
 * not simply "the topmost intersecting element", which flickers between two
 * headings when a short section is fully on screen, and marks nothing at all
 * while you are in the middle of a long one.
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
	const [activeId, setActiveId] = useState<string | null>(
		headings[0]?.id ?? null,
	);

	useEffect(() => {
		if (headings.length === 0) {
			return;
		}

		const ids = headings.map((heading) => heading.id);

		const update = () => {
			// A quarter down the viewport: the line your eye actually reads at.
			const line = window.innerHeight * 0.25;
			let current: string | null = null;

			for (const id of ids) {
				const element = document.getElementById(id);
				if (!element) {
					continue;
				}
				if (element.getBoundingClientRect().top <= line) {
					current = id;
				} else {
					break;
				}
			}

			// Before the first heading scrolls past, the first section is the one
			// being read — leaving it unmarked reads as a broken component.
			setActiveId(current ?? ids[0]);
		};

		update();
		// The read itself is a `getBoundingClientRect` per heading, which forces
		// layout — running it on every scroll event does that dozens of times per
		// frame for a result that can only change once per frame. One pending
		// frame at a time, cleared when it runs.
		let frame: number | null = null;
		const onScroll = () => {
			if (frame !== null) {
				return;
			}
			frame = window.requestAnimationFrame(() => {
				frame = null;
				update();
			});
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			if (frame !== null) {
				window.cancelAnimationFrame(frame);
			}
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", update);
		};
	}, [headings]);

	if (headings.length < 2) {
		return null;
	}

	return (
		<nav aria-labelledby="contents-heading" className="text-sm">
			<h2
				id="contents-heading"
				className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
			>
				Contents
			</h2>
			<ol className="mt-4 space-y-px border-l border-border">
				{headings.map((heading) => {
					const active = heading.id === activeId;
					return (
						<li key={heading.id}>
							<a
								href={`#${heading.id}`}
								aria-current={active ? "location" : undefined}
								className={cn(
									"-ml-px block border-l py-1.5 leading-snug transition-colors",
									heading.level === 3 ? "pl-7" : "pl-4",
									active
										? "border-brand text-foreground"
										: "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
								)}
							>
								{heading.text}
							</a>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
