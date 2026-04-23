type Props = {
  glyph?: string;
  className?: string;
  /** Opacity 0-1. Default 0.5. */
  opacity?: number;
  /** When true, render a long scrolling marquee row. */
  marquee?: boolean;
};

/**
 * Horizontal divider made of braille glyphs. Matches Swift `BrailleDivider`.
 * Default glyph is ⠒ for a quiet in-line rule. Pass "⣿" for a chunky bar.
 */
export function BrailleDivider({
  glyph = "⠒",
  className = "",
  opacity = 0.5,
  marquee = false,
}: Props) {
  const line = glyph.repeat(260);
  if (marquee) {
    return (
      <div className={`overflow-hidden leading-none ${className}`} aria-hidden>
        <div className="marquee whitespace-nowrap text-[10px] text-bone-3" style={{ opacity }}>
          <span className="inline-block pr-8">{line}</span>
          <span className="inline-block pr-8">{line}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`leading-none text-[10px] text-bone-3 truncate ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      {line}
    </div>
  );
}
