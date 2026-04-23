import { BrailleDivider } from "./BrailleDivider";

type Props = {
  title: string;
  subtitle?: string;
  tint?: "pink" | "cyan" | "violet" | "gold" | "bone";
  className?: string;
  id?: string;
};

const tintMap = {
  pink:   { mark: "text-pink",   rule: "text-pink/60"   },
  cyan:   { mark: "text-cyan",   rule: "text-cyan/50"   },
  violet: { mark: "text-violet", rule: "text-violet/50" },
  gold:   { mark: "text-gold",   rule: "text-gold/50"   },
  bone:   { mark: "text-bone",   rule: "text-bone-3"    },
} as const;

/** Hermes-agent-style titled header: ⣿⣿ [TITLE] ⣿⣿ over a braille rule. */
export function AgentHeader({ title, subtitle, tint = "pink", className = "", id }: Props) {
  const t = tintMap[tint];
  return (
    <div className={`flex flex-col gap-2 ${className}`} id={id}>
      <div className="flex items-center gap-3">
        <span aria-hidden className={`${t.mark} text-[13px]`}>⣿⣿</span>
        <span className="track-wider uppercase text-[11px] text-bone">
          [{title}]
        </span>
        <span aria-hidden className={`${t.mark} text-[13px]`}>⣿⣿</span>
        <span className="flex-1 truncate text-[10px] text-bone-3 overflow-hidden" aria-hidden>
          {"⠒".repeat(260)}
        </span>
      </div>
      {subtitle && (
        <p className="text-[11px] text-bone-3 track-wide">{subtitle}</p>
      )}
      <BrailleDivider className={t.rule} opacity={0.45} />
    </div>
  );
}
