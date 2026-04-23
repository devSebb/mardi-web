import { BrailleDivider } from "../chrome/BrailleDivider";

export function Nav() {
  return (
    <header className="relative z-10 w-full">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-pink text-[13px]">⣿⣿</span>
            <span className="track-wider uppercase text-bone">[MARDI]</span>
            <span aria-hidden className="text-pink text-[13px]">⣿⣿</span>
          </div>
          <nav className="flex items-center gap-5 text-bone-3">
            <a
              href="#pitch"
              className="uppercase track-wide hover:text-bone transition-colors"
            >
              pitch
            </a>
            <a
              href="#types"
              className="uppercase track-wide hover:text-bone transition-colors"
            >
              types
            </a>
            <a
              href="#how"
              className="uppercase track-wide hover:text-bone transition-colors"
            >
              how
            </a>
            <a
              href="https://github.com/devSebb/MARDI"
              target="_blank"
              rel="noreferrer"
              className="uppercase track-wide text-bone hover:text-pink transition-colors inline-flex items-center gap-2"
            >
              <span aria-hidden>⠿</span> github
            </a>
          </nav>
        </div>
        <div className="mt-4">
          <BrailleDivider marquee opacity={0.35} />
        </div>
      </div>
    </header>
  );
}
