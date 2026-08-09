"use client";

import { Button } from "@/components/ui/button";

/**
 * Subscribe panel.
 *
 * This used to be a full-bleed inverted slab (`bg-foreground text-background`),
 * which in dark mode made it the brightest object on an otherwise black page —
 * it pulled the eye past the meter and the entries to a form. It's now a
 * bordered panel on the page's own background, aligned to the same left margin
 * as everything above it, so it reads as the end of the column instead of an
 * advertisement dropped into it.
 *
 * NOTE: the form is not wired to a mailing provider yet — submitting it does
 * nothing useful.
 */
export function Newsletter() {
	return (
		<section className="relative border-t border-border/40 py-16 md:py-20">
			{/* Bottom wash, so the page closes on a tint the way it opened on one
			    rather than fading out to flat background above the footer. */}
			<div
				className="ambient-wash-bottom pointer-events-none absolute inset-0"
				aria-hidden="true"
			/>
			<div className="relative container mx-auto max-w-[1200px] px-4 sm:px-6">
				{/* The only tinted panel on the landing page. It's the page's one ask,
				    so it gets the accent wash and a brand top edge — that's enough to
				    mark it as the terminal block without going back to the inverted slab
				    this replaced. */}
				<div className="relative overflow-hidden rounded-2xl border border-border bg-brand-subtle p-8 md:p-10">
					<span
						className="rule-accent absolute inset-x-0 top-0 h-0.5"
						aria-hidden="true"
					/>
					{/* Faint ruling, echoing the meter's ticks at a larger pitch. */}
					<div
						className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px)] bg-size-[32px_100%] opacity-40"
						aria-hidden="true"
					/>
					<div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
						<div className="max-w-md">
							<h2 className="text-2xl font-bold tracking-tight md:text-3xl">
								Get it in your inbox
							</h2>
							<p className="mt-2 leading-relaxed text-muted-foreground">
								One email each morning with what survived the filter. No spam,
								unsubscribe any time.
							</p>
						</div>

						<form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
							<input
								type="email"
								placeholder="you@example.com"
								aria-label="Email address"
								className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-foreground transition-colors placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-brand focus:outline-none"
							/>
							{/* `indigo-600`, not the `--brand` step: the label is white, and
							    white on indigo-500 is 4.3:1 — under AA for this size. Same
							    step the archive's active filter pill and the auth mark use.

							    Inert until there's a provider behind it. As a submit button
							    in a form with no handler it reloaded the page, which reads
							    as a signup that did nothing rather than one that isn't
							    wired up yet. */}
							<Button
								type="button"
								size="lg"
								disabled
								title="Coming soon"
								className="h-12 rounded-full bg-indigo-600 px-7 font-semibold text-white hover:bg-indigo-700"
							>
								Subscribe
							</Button>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}
