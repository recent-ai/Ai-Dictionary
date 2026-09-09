/**
 * The one place that decides where images may be fetched from.
 *
 * `next.config.ts` builds its `remotePatterns` from this, and `ArticleBody`
 * checks a generated `src` against it before handing anything to `next/image`.
 * They have to agree: the optimizer *throws at render* for a host it wasn't
 * configured with, so one bad image URL in one article's markdown would take
 * that whole page down with a 500 rather than showing a broken image.
 */

/** Prefix of every public object in Supabase storage. */
export const SUPABASE_STORAGE_PREFIX = "/storage/v1/object/public/";

/**
 * Hostname of the configured Supabase project, or null if it can't be read.
 *
 * Derived from the URL rather than written out as `*.supabase.co`: a wildcard
 * subdomain lets the optimizer fetch and re-serve images from *any* Supabase
 * project, ours or not, under our own origin.
 */
export function supabaseImageHost(): string | null {
	const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!raw) {
		return null;
	}
	try {
		return new URL(raw).hostname;
	} catch {
		return null;
	}
}

/**
 * Whether `next/image` is configured to fetch this src.
 *
 * Mirrors the `remotePatterns` in `next.config.ts`, deliberately strictly:
 * anything this returns false for gets a plain `<img>` instead, which is a
 * worse image but a rendered page. Protocol-relative (`//host/x.png`) and
 * relative-with-a-query srcs both fail the `new URL` parse against a fixed
 * base in the way you'd want — they resolve to a host we then have to match.
 */
export function isOptimizableImageSrc(src: string): boolean {
	// A root-relative path is served by us, and needs no allowlist entry.
	if (src.startsWith("/") && !src.startsWith("//")) {
		return true;
	}

	let url: URL;
	try {
		url = new URL(src);
	} catch {
		return false;
	}

	const supabase = supabaseImageHost();
	if (
		url.protocol === "https:" &&
		supabase &&
		url.hostname === supabase &&
		url.pathname.startsWith(SUPABASE_STORAGE_PREFIX)
	) {
		return true;
	}

	if (
		process.env.NODE_ENV === "development" &&
		url.protocol === "http:" &&
		url.hostname === "127.0.0.1" &&
		url.port === "54321"
	) {
		return true;
	}

	return false;
}
