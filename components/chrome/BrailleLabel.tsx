type Props = {
  children: React.ReactNode;
  prefix?: string;
  accent?: "pink" | "bone" | "cyan" | "violet" | "gold";
  className?: string;
};

const accentClass: Record<NonNullable<Props["accent"]>, string> = {
  pink:   "text-pink",
  bone:   "text-bone",
  cyan:   "text-cyan",
  violet: "text-violet",
  gold:   "text-gold",
};

/** Leading braille marker + uppercased, spaced label. */
export function BrailleLabel({
  children,
  prefix = "⠿",
  accent = "pink",
  className = "",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-2 text-[11px] track-label uppercase ${accentClass[accent]} ${className}`}>
      <span aria-hidden>{prefix}</span>
      <span className="text-bone-2">{children}</span>
    </span>
  );
}
