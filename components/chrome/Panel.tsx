type Props = {
  children: React.ReactNode;
  /** Accent border — pink is default. Set to "none" to drop the glow. */
  accent?: "pink" | "cyan" | "violet" | "gold" | "bone" | "none";
  braille?: boolean;
  className?: string;
};

const accentClass: Record<NonNullable<Props["accent"]>, string> = {
  pink:   "pixel-border-pink",
  cyan:   "pixel-border-hi",
  violet: "pixel-border-hi",
  gold:   "pixel-border-hi",
  bone:   "pixel-border-hi",
  none:   "pixel-border",
};

/** Standard MARDI panel: ink fill, braille wallpaper, chunky pixel border. */
export function Panel({ children, accent = "none", braille = true, className = "" }: Props) {
  return (
    <div
      className={`relative bg-ink-2 ${braille ? "braille-field-soft" : ""} ${accentClass[accent]} ${className}`}
    >
      {children}
    </div>
  );
}
