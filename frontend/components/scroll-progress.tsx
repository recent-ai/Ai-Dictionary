"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * How far through the article you are.
 *
 * `bg-brand` rather than `--primary`, which is pure black in light mode and
 * pure white in dark — at the very top of the viewport that read as a rendering
 * seam rather than as a meter. The token already carries the per-theme step, so
 * there's no `dark:` variant to keep in sync. Two pixels: enough to see, not
 * enough to look like a loading bar.
 */
export function ScrollProgress() {
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 110,
		damping: 20,
		restDelta: 0.001,
	});
	return (
		<motion.div
			aria-hidden="true"
			className="fixed inset-x-0 top-0 z-60 h-[2px] origin-left bg-brand"
			style={{ scaleX }}
		/>
	);
}
