"use client";

import { useEffect, useState } from "react";

const URL_TARGET = "https://anthropic.com/research";
const TAGS = ["ai", "research", "reference"];

/**
 * A typing animation: the URL types in, then tags fade in one by one with
 * a braille "processing" bar, then a tiny "saved" state. Loops.
 */
export function SaveDemo() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 140), 60);
    return () => clearInterval(id);
  }, []);

  const typed = URL_TARGET.slice(0, Math.min(frame, URL_TARGET.length));
  const doneTyping = frame >= URL_TARGET.length;
  const thinking = doneTyping && frame < URL_TARGET.length + 22;
  const tagsVisible = Math.max(
    0,
    Math.min(frame - (URL_TARGET.length + 22), TAGS.length)
  );
  const saved = frame > URL_TARGET.length + 22 + TAGS.length * 8;

  const bar = thinking
    ? "⣾⣷⣯⣟⡿⢿⣻⣽".charAt(frame % 8).repeat(8)
    : saved
    ? "⣿⣿⣿⣿⣿⣿⣿⣿"
    : "⠒⠒⠒⠒⠒⠒⠒⠒";

  return (
    <div className="font-mono text-[11px] leading-[1.5] text-bone-2 select-none">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] track-label uppercase text-bone-3">capture · url</span>
        <span
          className={`text-[10px] track-wide uppercase ${
            saved ? "text-pink" : thinking ? "text-gold" : "text-bone-3"
          }`}
        >
          {saved ? "⠿ saved" : thinking ? "⠿ thinking…" : "· ready"}
        </span>
      </div>
      <div className="rounded-[2px] border border-rule bg-ink braille-field-soft p-3 space-y-2">
        <div>
          <span className="text-bone-3">url:&nbsp;</span>
          <span className="text-bone">{typed}</span>
          {!doneTyping && <span className="blink text-pink">▋</span>}
        </div>

        <div className="text-bone-3">
          tags:&nbsp;
          {TAGS.slice(0, tagsVisible).map((t) => (
            <span
              key={t}
              className="inline-block mr-1 px-1 text-[10px] track-wide uppercase bg-pink/10 text-pink"
            >
              [{t}]
            </span>
          ))}
          {tagsVisible < TAGS.length && doneTyping && (
            <span className="text-bone-4">…</span>
          )}
        </div>

        <div className="pt-1 flex items-center gap-2">
          <span className="text-bone-3 text-[10px] track-wide uppercase">vault</span>
          <span
            className={`tracking-[0.3em] text-[11px] ${
              saved ? "text-pink" : thinking ? "text-gold" : "text-bone-4"
            }`}
          >
            {bar}
          </span>
        </div>
      </div>
    </div>
  );
}
