import { Github, Linkedin, Twitter } from "lucide-react";

/**
 * Site footer — the other half of the chrome, matched to the nav.
 *
 * Two real bugs fixed here, not just styling:
 *
 * - The social icons were written as `<Twitter href="#">Twitter</Twitter>`.
 *   Lucide icons are SVG components: they ignore `href` and render no children,
 *   so the footer shipped three inert glyphs with no link and no accessible
 *   name. They're now anchors wrapping the icon, each with a visually hidden
 *   label, and only GitHub — the one real URL in the file — is a live link. The
 *   other two were `#`, so they're gone rather than shipped as dead ends.
 * - The copyright read 2025 from a hardcoded string. It's derived now.
 *
 * Visually it echoes the nav: same brand dot and wordmark pairing, same
 * container, and the top edge is a plain border rather than a second gradient
 * rule — one accented full-width hairline per page is the device, and the nav
 * already spends it.
 */

const SOCIALS = [
	{
		href: "https://github.com/recent-ai/Ai-Dictionary",
		label: "GitHub",
		Icon: Github,
	},
] as const;

/** Kept for the day these get real destinations. */
const UNLINKED = [
	{ label: "Twitter", Icon: Twitter },
	{ label: "LinkedIn", Icon: Linkedin },
] as const;

export function Footer() {
	return (
		<footer className="border-t border-border/60 bg-secondary/20 py-10">
			<div className="container mx-auto max-w-[1200px] px-4 sm:px-6">
				<div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-2.5">
						<span
							className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
							aria-hidden="true"
						/>
						<span className="text-lg font-bold tracking-tight">
							AI Dictionary
						</span>
					</div>

					<div className="flex items-center gap-5">
						{SOCIALS.map(({ href, label, Icon }) => (
							<a
								key={label}
								href={href}
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								<Icon className="h-[18px] w-[18px]" aria-hidden="true" />
								<span className="sr-only">{label}</span>
							</a>
						))}
						{/* Rendered but not linked — no destination exists yet, and a live
						    anchor to `#` is worse than a plain mark. */}
						{UNLINKED.map(({ label, Icon }) => (
							<span key={label} className="text-muted-foreground/40">
								<Icon className="h-[18px] w-[18px]" aria-hidden="true" />
								<span className="sr-only">{label} — not yet available</span>
							</span>
						))}
					</div>

					<p className="text-xs text-muted-foreground">
						&copy; {new Date().getFullYear()} AI Dictionary. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
