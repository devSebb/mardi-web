"use client";

import { useEffect, useState } from "react";

const QUERY = "anth";
const RESULTS = [
  { icon: "⠿", title: "anthropic / research index",   tag: "url"     },
  { icon: "⠿", title: "ssh  staging.anthrax.internal", tag: "ssh"     },
  { icon: "⠿", title: "cover letter — draft 3",        tag: "note"    },
  { icon: "⠿", title: "why-we-cache prompt",           tag: "prompt"  },
];

/**
 * A global quick-search overlay. The query types in; results scroll up and
 * the top one highlights in pink, ready to copy on Enter.
 */
export function RecallDemo() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 120), 75);
    return () => clearInterval(id);
  }, []);

  const typed = QUERY.slice(0, Math.min(frame, QUERY.length));
  const doneTyping = frame >= QUERY.length;
  const resultsShown = doneTyping
    ? Math.min(frame - QUERY.length, RESULTS.length)
    : 0;
  const highlight = frame > QUERY.length + RESULTS.length;

  return (
    <div className="font-mono text-[11px] leading-[1.45] text-bone-2 select-none">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] track-label uppercase text-bone-3">
          ⌘⇧m · global search
        </span>
        <span className={`text-[10px] track-wide uppercase ${highlight ? "text-pink" : "text-bone-3"}`}>
          {highlight ? "⠿ copy ↵" : "· typing"}
        </span>
      </div>
      <div className="rounded-[2px] border border-rule bg-ink braille-field-soft">
        <div className="px-3 py-2 border-b border-rule">
          <span className="text-bone-3">›&nbsp;</span>
          <span className="text-bone">{typed}</span>
          {!doneTyping && <span className="blink text-pink">▋</span>}
        </div>
        <ul className="divide-y divide-rule/60">
          {RESULTS.slice(0, resultsShown).map((r, i) => {
            const hi = highlight && i === 0;
            return (
              <li
                key={r.title}
                className={`flex items-center justify-between px-3 py-1.5 ${
                  hi ? "bg-pink/10" : ""
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={hi ? "text-pink" : "text-bone-3"}>{r.icon}</span>
                  <span className={hi ? "text-bone" : "text-bone-2"}>{r.title}</span>
                </span>
                <span
                  className={`text-[9px] track-wide uppercase ${
                    hi ? "text-pink" : "text-bone-3"
                  }`}
                >
                  {r.tag}
                </span>
              </li>
            );
          })}
          {resultsShown === 0 && (
            <li className="px-3 py-1.5 text-bone-4">…</li>
          )}
        </ul>
      </div>
    </div>
  );
}
