import { AgentHeader } from "../chrome/AgentHeader";

type Entry = {
  name: string;
  hint: string;
  example: string;
  accent: "violet" | "cyan" | "orange" | "pink" | "bone" | "gold";
  glyph: string;
};

const ROWS: Entry[] = [
  { name: "url",       hint: "safari · chrome · arc · brave · edge", example: "anthropic.com/research",        accent: "violet", glyph: "⣾" },
  { name: "snippet",   hint: "any text selection",                   example: "regex \\[bracketed\\] tokens",   accent: "cyan",   glyph: "⣿" },
  { name: "ssh",       hint: "command + host",                       example: "ssh root@staging.box",           accent: "orange", glyph: "⣯" },
  { name: "prompt",    hint: "your favourite llm prompts",           example: "explain this code in one line",  accent: "pink",   glyph: "⣻" },
  { name: "signature", hint: "email sign-offs",                      example: "— seb, sent from the couch",     accent: "violet", glyph: "⣽" },
  { name: "reply",     hint: "canned replies",                       example: "thanks — circling back friday",  accent: "cyan",   glyph: "⣟" },
  { name: "note",      hint: "free-form thoughts",                   example: "the cache ttl is 5 minutes.",    accent: "bone",   glyph: "⡿" },
  { name: "ocr",       hint: "select mode · drag a box",             example: "(pulled from the screen)",       accent: "gold",   glyph: "⣷" },
];

const accentMap = {
  violet: "text-violet",
  cyan:   "text-cyan",
  orange: "text-orange",
  pink:   "text-pink",
  gold:   "text-gold",
  bone:   "text-bone",
} as const;

const dotMap = {
  violet: "bg-violet",
  cyan:   "bg-cyan",
  orange: "bg-orange",
  pink:   "bg-pink",
  gold:   "bg-gold",
  bone:   "bg-bone",
} as const;

export function MemoryTypes() {
  return (
    <section id="types" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <AgentHeader
        title="what you save"
        subtitle="eight memory types. each with its own accent, folder, and recall rule."
        tint="violet"
      />

      <div className="mt-10 pixel-border bg-ink-2 braille-field-soft">
        <div className="grid grid-cols-12 px-4 py-2.5 border-b border-rule text-[10px] track-label uppercase text-bone-3">
          <span className="col-span-1">·</span>
          <span className="col-span-2">type</span>
          <span className="col-span-4">where it comes from</span>
          <span className="col-span-5">example</span>
        </div>
        <ul>
          {ROWS.map((r, i) => (
            <li
              key={r.name}
              className={`grid grid-cols-12 items-center px-4 py-3 text-[12.5px] hover:bg-ink-3/70 transition-colors ${
                i < ROWS.length - 1 ? "border-b border-rule/50" : ""
              }`}
            >
              <span className={`col-span-1 ${accentMap[r.accent]} text-[16px] leading-none`}>
                {r.glyph}
              </span>
              <span className="col-span-2 flex items-center gap-2">
                <span className={`inline-block w-1.5 h-1.5 ${dotMap[r.accent]}`} />
                <span className="uppercase track-wide text-bone">{r.name}</span>
              </span>
              <span className="col-span-4 text-bone-3">{r.hint}</span>
              <span className="col-span-5 text-bone-2 font-mono truncate">
                <span className="text-bone-4 pr-2">›</span>
                {r.example}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
