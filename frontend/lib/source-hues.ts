/**
 * Source → hue slot.
 *
 * Colour follows the entity, not its position in the list: the slot is derived
 * from the source's own name, so filtering the archive down to three sources
 * doesn't repaint the survivors, and a source keeps the same hue on the archive
 * index and on the entry page. Cheap string hash — this runs per row over 244
 * rows, so it stays synchronous and allocation-free.
 *
 * Four slots and more than four sources means collisions are expected. That's
 * fine here because the hue is never the only carrier: the source name is
 * printed next to every dot, in every place a dot appears. The colour is a
 * scanning aid for "these two rows are the same publication", not an identifier
 * — nothing is gated behind telling hue 2 from hue 4.
 *
 * Lives in `lib` rather than beside the archive component because both a client
 * component (the index) and a server component (the entry page) need it, and
 * importing it from the client module would pull that whole graph server-side.
 */

/** The four categorical slots, as utility class sets rather than raw hex. */
const HUE_CLASSES = [
	{ dot: "bg-hue-1", text: "text-hue-1", wash: "bg-hue-1-wash" },
	{ dot: "bg-hue-2", text: "text-hue-2", wash: "bg-hue-2-wash" },
	{ dot: "bg-hue-3", text: "text-hue-3", wash: "bg-hue-3-wash" },
	{ dot: "bg-hue-4", text: "text-hue-4", wash: "bg-hue-4-wash" },
] as const;

export type SourceHue = (typeof HUE_CLASSES)[number];

/** Stable per-source hue slot. Same name in, same slot out, always. */
export function hueFor(source: string): SourceHue {
	let hash = 0;
	for (let i = 0; i < source.length; i++) {
		hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
	}
	return HUE_CLASSES[hash % HUE_CLASSES.length];
}
