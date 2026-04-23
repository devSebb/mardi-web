"use client";

import { useEffect, useState } from "react";

/**
 * Screen-shaped braille minimap. A cursor dot drifts to the top-right corner,
 * dwells, then a small fish glyph flashes on. Loops.
 */
export function SummonDemo() {
  const COLS = 22;
  const ROWS = 10;
  const CORNER_X = COLS - 2;
  const CORNER_Y = 1;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 120), 70);
    return () => clearInterval(id);
  }, []);

  // cursor path: a meandering stroll towards the corner over ~6s
  const p = Math.min(tick / 80, 1);
  const cx = Math.round(2 + (CORNER_X - 2) * p + Math.sin(tick * 0.18) * 1.6);
  const cy = Math.round(ROWS - 2 - (ROWS - 3) * p + Math.cos(tick * 0.22) * 0.6);
  const summoned = tick > 82 && tick < 115;

  return (
    <div className="font-mono text-[11px] leading-[1.15] text-bone-2 select-none">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] track-label uppercase text-bone-3">macOS · top-right</span>
        <span className={`text-[10px] track-wide uppercase ${summoned ? "text-pink" : "text-bone-3"}`}>
          {summoned ? "⠿ summoned" : "· idle"}
        </span>
      </div>
      <div className="relative rounded-[2px] border border-rule bg-ink braille-field-soft p-2">
        {Array.from({ length: ROWS }).map((_, r) => {
          let row = "";
          for (let c = 0; c < COLS; c++) {
            const isCorner =
              summoned && Math.abs(c - CORNER_X) <= 1 && Math.abs(r - CORNER_Y) <= 1;
            if (isCorner) {
              row += "⣿";
            } else if (c === cx && r === cy) {
              row += "⬤";
            } else {
              row += (r + c) % 5 === 0 ? "⠂" : " ";
            }
          }
          return (
            <div key={r} className="whitespace-pre">
              {row.split("").map((ch, i) => (
                <span
                  key={i}
                  className={
                    ch === "⣿"
                      ? "text-pink"
                      : ch === "⬤"
                      ? "text-bone"
                      : "text-bone-4"
                  }
                >
                  {ch}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
