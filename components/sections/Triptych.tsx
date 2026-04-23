import { AgentHeader } from "../chrome/AgentHeader";
import { SummonDemo } from "../mardi/SummonDemo";
import { SaveDemo } from "../mardi/SaveDemo";
import { RecallDemo } from "../mardi/RecallDemo";

type Card = {
  step: string;
  title: string;
  body: string;
  demo: React.ReactNode;
  voice: string;
};

const CARDS: Card[] = [
  {
    step: "01",
    title: "summon",
    body:
      "pull your cursor into the top-right corner. mardi dwells for ~400ms, then pops in — no shortcuts to memorize, no clutter on your menubar.",
    demo: <SummonDemo />,
    voice: "“Save something?”",
  },
  {
    step: "02",
    title: "save",
    body:
      "paste a url, a snippet, a command. mardi asks an llm (claude or openrouter) to title it and tag it, then writes it as obsidian-friendly markdown.",
    demo: <SaveDemo />,
    voice: "“Got it. Saved.”",
  },
  {
    step: "03",
    title: "recall",
    body:
      "hit ⌘⇧m anywhere. hybrid search — local embeddings + fts5 — surfaces what you meant, not just what you typed. enter copies the top hit.",
    demo: <RecallDemo />,
    voice: "“Here. The top one.”",
  },
];

export function Triptych() {
  return (
    <section id="pitch" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <AgentHeader
        title="pitch"
        subtitle="three beats. that's the whole app."
        tint="pink"
      />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <article
            key={c.step}
            className="group relative bg-ink-2 pixel-border hover:pixel-border-hi transition-shadow"
          >
            <div className="p-5 border-b border-rule flex items-center justify-between">
              <span className="text-[10px] track-label uppercase text-bone-3">
                step {c.step}
              </span>
              <span className="text-[10px] track-label uppercase text-pink">
                ⠿ {c.title}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <h3 className="text-2xl text-bone leading-[1.1] uppercase track-wide">
                {c.title}.
              </h3>
              <p className="text-[12.5px] text-bone-2 leading-[1.65] text-pretty">
                {c.body}
              </p>

              <div className="pt-2">
                <div className="rounded-[2px] p-3 bg-ink pixel-border">
                  {c.demo}
                </div>
              </div>

              <p className="text-[11px] italic text-bone-3 pt-1">
                <span className="text-pink not-italic">›</span> {c.voice}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
