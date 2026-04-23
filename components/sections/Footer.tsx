import { BrailleDivider } from "../chrome/BrailleDivider";

export function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-12">
      <BrailleDivider opacity={0.4} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        <div>
          <div className="flex items-center gap-3 text-[11px]">
            <span aria-hidden className="text-pink text-[13px]">⣿⣿</span>
            <span className="track-wider uppercase text-bone">[mardi]</span>
            <span aria-hidden className="text-pink text-[13px]">⣿⣿</span>
          </div>
          <p className="mt-3 text-[11px] text-bone-3 max-w-sm leading-[1.7]">
            a retro-futuristic macos companion. greenfield april 2026. built by
            one human and a very calm fish.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-[11px] md:items-center">
          <span className="text-bone-3 track-label uppercase">links</span>
          <a
            href="https://github.com/devSebb/MARDI"
            target="_blank"
            rel="noreferrer"
            className="text-bone hover:text-pink transition-colors"
          >
            github.com/devsebb/mardi
          </a>
          <span className="text-bone-3">⌘⇧m — global recall</span>
          <span className="text-bone-3">⌘, — settings</span>
        </div>

        <div className="md:text-right text-[11px] text-bone-3 space-y-1">
          <p>
            typeset in <span className="text-bone">departure mono</span> —
            helena zhang · ofl 1.1
          </p>
          <p>braille © unicode · u+2800 &ndash; u+28ff</p>
          <p>
            hosted on <span className="text-bone">vercel</span> · hand-lettered
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <span className="text-[10px] track-label uppercase text-bone-4">
          © {new Date().getFullYear()} · mardi
        </span>
        <span className="text-[11px] italic text-pink/70 flicker">
          “still here.”
        </span>
        <span className="text-[10px] track-label uppercase text-bone-4">
          v0.1.0
        </span>
      </div>
    </footer>
  );
}
