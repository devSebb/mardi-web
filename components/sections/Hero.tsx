"use client";

import { Mardi } from "../mardi/Mardi";
import { BrailleLabel } from "../chrome/BrailleLabel";
import { Wordmark } from "../chrome/Wordmark";
import { BrailleDivider } from "../chrome/BrailleDivider";

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-20 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
        {/* ── Left: copy ────────────────────────────────────────── */}
        <div className="md:col-span-7 flex flex-col gap-7">
          <div className="flex items-center gap-3">
            <BrailleLabel accent="pink">v0.1 · greenfield · macOS</BrailleLabel>
            <span className="text-bone-4 text-[11px]">·</span>
            <span className="text-bone-3 text-[11px] track-wide uppercase">
              apr 2026
            </span>
          </div>

          <Wordmark size={34} className="-mx-1" />

          <h1 className="text-3xl sm:text-5xl md:text-[3.4rem] leading-[1.05] text-bone text-balance">
            a second brain
            <br />
            that lives in the
            <br />
            <span className="text-pink">corner</span> of your screen.
          </h1>

          <p className="max-w-xl text-bone-2 text-[13.5px] sm:text-[14px] leading-[1.7] text-pretty">
            pull your cursor into the corner. mardi pops in and asks what to
            keep — a url, a snippet, an ssh command, a prompt, a signature, a
            note. he auto-tags it, writes a title, and drops it into a plain
            markdown vault you already control.
          </p>

          <figure className="border-l-2 border-pink/60 pl-4 max-w-md">
            <blockquote className="text-bone text-[13px] leading-[1.65]">
              “Hi. I&apos;m Mardi. I&apos;ll remember things for you.”
            </blockquote>
            <figcaption className="mt-1 text-[10px] track-wide uppercase text-bone-3">
              — first greeting
            </figcaption>
          </figure>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://github.com/devSebb/MARDI"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 px-4 py-2.5 text-[12px] track-wide uppercase pixel-border-pink bg-pink/10 text-bone hover:bg-pink/20 transition-colors"
            >
              <span aria-hidden className="text-pink">⠿</span>
              github · devsebb/mardi
              <span
                aria-hidden
                className="text-pink opacity-70 group-hover:translate-x-0.5 transition-transform"
              >
                →
              </span>
            </a>
            <a
              href="#pitch"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] track-wide uppercase text-bone-2 hover:text-bone transition-colors"
            >
              how it works
              <span aria-hidden>↓</span>
            </a>
          </div>
        </div>

        {/* ── Right: Mardi ──────────────────────────────────────── */}
        <div className="md:col-span-5">
          <Mardi />
        </div>
      </div>

      {/* full-width ticker */}
      <div className="mt-16 sm:mt-20">
        <div className="flex items-center gap-3 text-[10px] track-label uppercase text-bone-3 pb-2">
          <span>⠿</span>
          <span>now shipping in v0</span>
          <span className="flex-1"><BrailleDivider opacity={0.35} /></span>
        </div>
        <div className="overflow-hidden">
          <div className="marquee flex whitespace-nowrap text-[12px] text-bone-3 track-wider uppercase">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="inline-flex items-center gap-6 pr-6">
                <Beat>summon</Beat>
                <Beat pink>·</Beat>
                <Beat>save</Beat>
                <Beat pink>·</Beat>
                <Beat>recall</Beat>
                <Beat pink>·</Beat>
                <Beat>obsidian-compatible vault</Beat>
                <Beat pink>·</Beat>
                <Beat>local embeddings · on-device</Beat>
                <Beat pink>·</Beat>
                <Beat>your keys · your data</Beat>
                <Beat pink>·</Beat>
                <Beat>⌘⇧m anywhere</Beat>
                <Beat pink>·</Beat>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Beat({ children, pink }: { children: React.ReactNode; pink?: boolean }) {
  return <span className={pink ? "text-pink" : ""}>{children}</span>;
}
