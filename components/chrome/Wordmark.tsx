type Props = { size?: number; className?: string };

/**
 * MARDI wordmark rendered in 5×7 pixel letters, each pixel plotted as a braille
 * ⣿ block. Crisp at any size because it's text, and editable: tweak the GLYPHS
 * string to re-letter.  Each letter is 5 cols wide with a 1-col gutter.
 */
export function Wordmark({ size = 22, className = "" }: Props) {
  return (
    <span
      className={`font-mono inline-block leading-[1.02] text-bone ${className}`}
      style={{ fontSize: size, letterSpacing: "0.02em" }}
      aria-label="MARDI"
      role="img"
    >
      {ROWS.map((r, i) => (
        <span key={i} className="block whitespace-pre">{r}</span>
      ))}
    </span>
  );
}

/* ── Bitmap letters ──────────────────────────────────────────────────
   5-wide × 7-tall. Filled pixel = ⣿, blank = a space.
   Pattern chosen for readability at small sizes.                 */
const LETTERS: Record<string, string[]> = {
  M: [
    "⣿   ⣿",
    "⣿⣿ ⣿⣿",
    "⣿ ⣿ ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
  ],
  A: [
    "  ⣿  ",
    " ⣿ ⣿ ",
    "⣿   ⣿",
    "⣿⣿⣿⣿⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
  ],
  R: [
    "⣿⣿⣿⣿ ",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿⣿⣿⣿ ",
    "⣿ ⣿  ",
    "⣿  ⣿ ",
    "⣿   ⣿",
  ],
  D: [
    "⣿⣿⣿⣿ ",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿   ⣿",
    "⣿⣿⣿⣿ ",
  ],
  I: [
    "⣿⣿⣿⣿⣿",
    "  ⣿  ",
    "  ⣿  ",
    "  ⣿  ",
    "  ⣿  ",
    "  ⣿  ",
    "⣿⣿⣿⣿⣿",
  ],
};

const WORD = "MARDI";
const GAP = " ";
const ROWS: string[] = Array.from({ length: 7 }, (_, r) =>
  WORD.split("")
    .map((ch) => LETTERS[ch]?.[r] ?? "")
    .join(GAP)
);
