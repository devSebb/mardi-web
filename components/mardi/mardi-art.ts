/**
 * Mardi — shared types, palette, and braille plumbing.
 *
 * Pure TS. Used by the web renderer (`BrailleFish.tsx`) and safe to import
 * from any other app (native, terminal, worker) that wants to render Mardi.
 */

export type MardiMood =
  | "idle"
  | "summoned"
  | "thinking"
  | "success"
  | "error"
  | "sleeping";

export const MOOD_COLOR: Record<MardiMood, string> = {
  idle:     "#f3f1ec", // bone — quietly present
  summoned: "#ff2ecc", // pink — THE accent
  thinking: "#ffb63d", // gold
  success:  "#3ef0ff", // cyan
  error:    "#ff3355", // red
  sleeping: "#6b6860", // bone-3
};

/**
 * Bit layout of the 8 dots inside a Unicode braille cell (U+2800..U+28FF).
 * Each entry: (dot-col offset, dot-row offset, bit).
 *
 *   (0,0)=0x01   (1,0)=0x08
 *   (0,1)=0x02   (1,1)=0x10
 *   (0,2)=0x04   (1,2)=0x20
 *   (0,3)=0x40   (1,3)=0x80
 */
export const BRAILLE_LAYOUT: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0x01], [1, 0, 0x08],
  [0, 1, 0x02], [1, 1, 0x10],
  [0, 2, 0x04], [1, 2, 0x20],
  [0, 3, 0x40], [1, 3, 0x80],
];

/**
 * 4×4 Bayer dithering matrix, normalised to [0..1). Use as a per-pixel
 * threshold when converting a continuous-tone image to 1-bit dots — gives
 * a rich stipple pattern where pure threshold gives a hard silhouette.
 */
export const BAYER_4: readonly (readonly number[])[] = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
].map((row) => row.map((v) => v / 16));
