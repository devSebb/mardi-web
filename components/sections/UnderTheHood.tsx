import { AgentHeader } from "../chrome/AgentHeader";

const ROWS: { k: string; v: string; accent?: "pink" | "cyan" | "violet" | "gold" }[] = [
  { k: "platform",   v: "native swift 6 · swiftui · macos 15+", accent: "violet" },
  { k: "storage",    v: "sqlite + sqlite-vec + fts5",            accent: "cyan"   },
  { k: "embeddings", v: "apple naturallanguage · on-device",     accent: "cyan"   },
  { k: "llm",        v: "claude · openrouter · your api key",    accent: "pink"   },
  { k: "vault",      v: "obsidian-compatible markdown",          accent: "gold"   },
  { k: "search",     v: "hybrid · reciprocal rank fusion",       accent: "pink"   },
  { k: "perms",      v: "automation · screen · notifications",   accent: "violet" },
  { k: "not used",   v: "accessibility · input monitoring",      accent: "gold"   },
];

const accentMap = {
  pink:   "text-pink",
  cyan:   "text-cyan",
  violet: "text-violet",
  gold:   "text-gold",
} as const;

export function UnderTheHood() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <AgentHeader
        title="under the hood"
        subtitle="local-first by default. your keys, your data, your machine."
        tint="gold"
      />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 flex flex-col gap-5">
          <h3 className="text-2xl text-bone leading-[1.15] text-balance">
            no cloud. no account. no telemetry. the vault is a folder of
            markdown files you can delete with <span className="text-pink">rm</span>.
          </h3>
          <p className="text-[13px] text-bone-2 leading-[1.7] text-pretty">
            mardi is a one-binary macos app that stores everything in{" "}
            <code className="text-bone px-1 bg-ink-3">~/Documents/MARDI-Vault/</code>
            . open it in obsidian. back it up with time machine. sync it with
            whatever you sync with. when you leave, you leave with everything.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["offline-first", "owned files", "no lock-in", "bring-your-own-llm"].map((t) => (
              <span
                key={t}
                className="px-2 py-1 text-[10px] track-wide uppercase pixel-border text-bone-2"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="pixel-border bg-ink-2 braille-field-soft">
            <div className="px-4 py-2.5 border-b border-rule flex items-center justify-between">
              <span className="text-[10px] track-label uppercase text-bone-3">
                ⣿⣿ spec sheet
              </span>
              <span className="text-[10px] track-label uppercase text-gold">
                v0.1.0
              </span>
            </div>
            <dl>
              {ROWS.map((r, i) => (
                <div
                  key={r.k}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 text-[12.5px] ${
                    i < ROWS.length - 1 ? "border-b border-rule/50" : ""
                  }`}
                >
                  <dt className={`col-span-4 uppercase track-wide ${accentMap[r.accent ?? "pink"]}`}>
                    <span className="text-bone-4 pr-2">›</span>
                    {r.k}
                  </dt>
                  <dd className="col-span-8 text-bone-2">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
