"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrailleDivider } from "../chrome/BrailleDivider";
import { BrailleFish } from "./BrailleFish";
import { MOOD_COLOR, type MardiMood } from "./mardi-art";
import { MARDI_LINES } from "./mardi-lines";

export type { MardiMood } from "./mardi-art";

const MOODS: readonly MardiMood[] = [
  "idle",
  "summoned",
  "thinking",
  "success",
  "error",
  "sleeping",
];

type Props = {
  /** Controlled mood. If omitted, the component owns its own state. */
  mood?: MardiMood;
  onMoodChange?: (m: MardiMood) => void;
  /** Hide the mood selector (e.g. when embedding Mardi in a smaller context). */
  showSelector?: boolean;
  /** Hide the dialogue caption row. */
  showCaption?: boolean;
  /** Hide the top chrome ("mardi · fishbowl"). */
  showChrome?: boolean;
  /**
   * Fish rendering size, in px, when not responsive. When `responsive` is
   * true the fish fills the panel.
   */
  fishSize?: number;
  className?: string;
};

/**
 * Mardi — the full character as a drop-in React component.
 *
 * Owns dialogue rotation, mood state (if uncontrolled), and the fishbowl
 * chrome. For other apps that just want the animated fish, import
 * `BrailleFish` directly instead.
 */
export function Mardi({
  mood: controlledMood,
  onMoodChange,
  showSelector = true,
  showCaption = true,
  showChrome = true,
  fishSize = 360,
  className = "",
}: Props) {
  const [innerMood, setInnerMood] = useState<MardiMood>("idle");
  const mood = controlledMood ?? innerMood;
  const setMood = (m: MardiMood) => {
    if (controlledMood === undefined) setInnerMood(m);
    onMoodChange?.(m);
  };

  // ── Dialogue rotation ────────────────────────────────────────────────
  // On mood change: jump to a fresh line from that mood's pool.
  // While a mood lingers: rotate every ~6s so Mardi doesn't feel frozen.
  const [lineIdx, setLineIdx] = useState(() => Math.floor(Math.random() * 5));
  const moodRef = useRef(mood);
  useEffect(() => {
    if (moodRef.current !== mood) {
      moodRef.current = mood;
      setLineIdx((i) => (i + 1 + Math.floor(Math.random() * 2)) % MARDI_LINES[mood].length);
    }
  }, [mood]);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIdx((i) => (i + 1) % MARDI_LINES[moodRef.current].length);
    }, 6200);
    return () => clearInterval(id);
  }, []);

  const line = useMemo(() => {
    const pool = MARDI_LINES[mood];
    return pool[lineIdx % pool.length];
  }, [mood, lineIdx]);

  return (
    <div className={`relative mx-auto w-full max-w-[420px] ${className}`}>
      <div className="relative aspect-square bg-ink-2 pixel-border braille-field-soft overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <BrailleFish mood={mood} size={fishSize} />
        </div>

        {showChrome && (
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-[10px] track-wide uppercase text-bone-3 pointer-events-none">
            <span className="flex items-center gap-1.5">
              <span aria-hidden>⣿⣿</span>
              <span>mardi · fishbowl</span>
            </span>
            <span className={moodColorClass(mood)} aria-live="polite">
              {mood}
            </span>
          </div>
        )}

        {showCaption && (
          <div className="absolute left-3 right-3 bottom-3 pointer-events-none">
            <BrailleDivider opacity={0.3} />
            <p
              className="mt-2 text-[11px] text-bone-2 leading-[1.45] min-h-[2.6em]"
              aria-live="polite"
            >
              <span className={moodColorClass(mood)}>›</span>{" "}
              <span className="flicker">{line}</span>
            </p>
          </div>
        )}
      </div>

      {showSelector && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              aria-pressed={mood === m}
              className={`px-2.5 py-1 text-[10px] track-wide uppercase pixel-border transition-colors ${
                mood === m
                  ? "bg-pink/15 text-bone pixel-border-pink"
                  : "text-bone-3 hover:text-bone"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { MOOD_COLOR };

function moodColorClass(m: MardiMood) {
  switch (m) {
    case "idle":     return "text-bone";
    case "summoned": return "text-pink";
    case "thinking": return "text-gold";
    case "success":  return "text-cyan";
    case "error":    return "text-red";
    case "sleeping": return "text-bone-3";
  }
}
