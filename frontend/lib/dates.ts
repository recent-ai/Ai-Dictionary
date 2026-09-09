/**
 * One parser for the display dates `blog-data` produces.
 *
 * Dates reach the UI already formatted — "April 23, 2026" — so anything that
 * needs to sort or group by date has to read that string back. Both the archive
 * and the article page do, and they have to agree, or the "older"/"newer" links
 * on an entry point somewhere other than the neighbours in the list you
 * clicked through from.
 */

const MONTHS = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];

const DISPLAY_DATE = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/;

/**
 * A formatted date back to ms since epoch, or null if it isn't one.
 *
 * Read as UTC, deliberately. `Date.parse("April 23, 2026")` interprets a
 * date-only string in the *runtime's* local zone, and every label built from
 * the result is formatted with `timeZone: "UTC"` — so on a server anywhere east
 * of Greenwich the whole archive displayed one day early, and entries dated the
 * first of a month were filed under the month before.
 */
export function parseDisplayDate(
	display: string | null | undefined,
): number | null {
	const value = (display ?? "").trim();
	if (!value || value === "Unknown Date") {
		return null;
	}

	const match = value.match(DISPLAY_DATE);
	if (match) {
		const month = MONTHS.indexOf(match[1].toLowerCase());
		if (month >= 0) {
			return Date.UTC(Number(match[3]), month, Number(match[2]));
		}
	}

	// `formatDate` passes through anything it couldn't parse, so the string may
	// still be a raw ISO date — which `Date.parse` already reads as UTC.
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}
