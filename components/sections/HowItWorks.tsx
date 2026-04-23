import { AgentHeader } from "../chrome/AgentHeader";

const STEPS = [
  {
    n: "01",
    head: "hot corner",
    body:
      "polled mouse location. no accessibility api. no input monitoring. mardi just notices you're in the corner.",
    glyph: "⠿⠿⠿⠿",
  },
  {
    n: "02",
    head: "capture form",
    body:
      "the clipboard pre-fills for you. pick a type or let mardi infer one. zero fields are required.",
    glyph: "⣶⣶⣶⣶",
  },
  {
    n: "03",
    head: "llm tagging",
    body:
      "claude or openrouter writes a title, three tags, and a one-line summary. fallback titles if the api is down.",
    glyph: "⣿⣾⣽⣯",
  },
  {
    n: "04",
    head: "vault write",
    body:
      "plain markdown with obsidian-compatible yaml. one file per memory. your folder, your disk, your backups.",
    glyph: "⣿⣿⣿⣿",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <AgentHeader
        title="how it works"
        subtitle="four stages. every one is local except the tagging call you configured."
        tint="cyan"
      />

      <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="relative bg-ink-2 pixel-border p-5 flex flex-col gap-4 min-h-[200px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] track-label uppercase text-bone-3">
                stage {s.n}
              </span>
              <span className="text-cyan text-[13px] tracking-[0.2em]">{s.glyph}</span>
            </div>
            <h3 className="text-lg text-bone uppercase track-wide">{s.head}</h3>
            <p className="text-[12.5px] text-bone-2 leading-[1.65] text-pretty">
              {s.body}
            </p>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-pink text-[14px]"
              >
                ›
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
