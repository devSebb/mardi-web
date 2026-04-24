"use client";

import { useEffect, useRef } from "react";
import {
  BRAILLE_LAYOUT,
  MOOD_COLOR,
  clearGrid,
  drawMardi,
  newGrid,
  poseFor,
  type DotGrid,
  type MardiMood,
} from "./mardi-art";

export type { MardiMood } from "./mardi-art";

type Props = {
  /** Current mood. Drives colour + motion character. */
  mood?: MardiMood;
  /**
   * Rendered size in CSS pixels. If `responsive` is true, this is treated as
   * a minimum and the canvas fills its parent square.
   */
  size?: number;
  /** If true, canvas fills its parent (parent must be square). */
  responsive?: boolean;
  /** Grid of braille cells. Dot grid is cols*2 × rows*4. */
  cols?: number;
  rows?: number;
  className?: string;
  /** Soft coloured halo behind the fish. */
  glow?: boolean;
  /** Optional override palette, keyed by mood. Defaults to `MOOD_COLOR`. */
  palette?: Partial<Record<MardiMood, string>>;
};

type Bubble = {
  /** Position in dot coords. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Age in seconds. */
  age: number;
  /** Total life in seconds. */
  ttl: number;
};

/**
 * BrailleFish — Mardi, rendered entirely in Unicode braille via a procedural
 * dot grid. No PNG sampling, no external assets, fully reactive to mood.
 *
 * This component is designed to be reusable in any app: drop it in, pass a
 * `mood`, and that's it. The character logic lives in `mardi-art.ts`; this
 * file is the web rendering surface.
 */
export function BrailleFish({
  mood = "idle",
  size = 320,
  responsive = false,
  cols = 48,
  rows = 24,
  className = "",
  glow = true,
  palette,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mood is read from a ref inside the rAF loop so mood changes don't tear
  // down the animation (phase continuity > correctness of dep array).
  const moodRef = useRef<MardiMood>(mood);
  moodRef.current = mood;

  // For colour-lerp on mood change.
  const prevMoodRef = useRef<MardiMood>(mood);
  const moodChangedAtRef = useRef<number>(0);
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      moodChangedAtRef.current = performance.now();
    }
  }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotCols = cols * 2;
    const dotRows = rows * 4;
    const grid: DotGrid = newGrid(dotCols, dotRows);

    // ── Sizing (responsive-aware, DPR-aware, survives monitor switch) ──
    let cssSize = size;
    const resize = () => {
      if (responsive) {
        const r = wrap.getBoundingClientRect();
        cssSize = Math.max(size, Math.min(r.width, r.height));
      } else {
        cssSize = size;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (responsive) ro.observe(wrap);
    window.addEventListener("resize", resize);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    const onMQ = () => {
      reduced = mq.matches;
    };
    mq.addEventListener?.("change", onMQ);

    // ── Offscreen pause via IntersectionObserver ─────────────────────
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    // ── Animation state ──────────────────────────────────────────────
    const start = performance.now();
    let raf = 0;
    let lastFrame = 0;

    let nextBlink = 2 + Math.random() * 4;
    let blinkUntil = 0;
    let nextGlitch = 6 + Math.random() * 10;
    let glitchUntil = 0;
    let glitchRow = -1;
    let glitchShift = 0;

    const bubbles: Bubble[] = [];
    let prevMood: MardiMood = moodRef.current;

    const emitBurst = (count: number, cx: number, cy: number) => {
      for (let i = 0; i < count; i++) {
        bubbles.push({
          x: cx + (Math.random() - 0.5) * 4,
          y: cy + (Math.random() - 0.5) * 2,
          vx: (Math.random() - 0.5) * 6,
          vy: -4 - Math.random() * 3,
          age: 0,
          ttl: 1.4 + Math.random() * 0.8,
        });
      }
    };

    const palOf = (m: MardiMood) => palette?.[m] ?? MOOD_COLOR[m];

    const hexToRgb = (hex: string) => {
      const h = hex.replace("#", "");
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ] as const;
    };
    const mix = (
      a: readonly [number, number, number],
      b: readonly [number, number, number],
      t: number,
    ) =>
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

    // ── Draw loop (capped to ~24fps for that CRT feel) ───────────────
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (now - lastFrame < 1000 / 24) return;
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;

      const t = (now - start) / 1000;
      const m = moodRef.current;

      // mood-entry events
      if (m !== prevMood) {
        if (m === "success") emitBurst(7, dotCols * 0.57 + 27, dotRows * 0.5 + 2);
        if (m === "summoned") emitBurst(3, dotCols * 0.57 + 27, dotRows * 0.5 + 2);
        prevMood = m;
      }

      // blink scheduling — natural feel, longer on error (wide eyes)
      if (t > nextBlink && blinkUntil === 0 && m !== "sleeping") {
        blinkUntil = t + 0.12;
        nextBlink = t + (m === "error" ? 0.4 : 3 + Math.random() * 5);
      }
      let eyeOpen = 1;
      if (m === "sleeping") eyeOpen = 0;
      else if (t < blinkUntil) eyeOpen = 0.1;
      else blinkUntil = 0;

      // rare glitch — one dot row shifts by a cell for a single frame
      if (!reduced && t > nextGlitch) {
        glitchRow = Math.floor(Math.random() * dotRows);
        glitchShift = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2));
        glitchUntil = t + 0.06;
        nextGlitch = t + 8 + Math.random() * 14;
      }
      const shearActive = t < glitchUntil;

      const pose = poseFor({
        t,
        mood: m,
        dotCols,
        dotRows,
        blink: eyeOpen,
        still: reduced,
      });

      clearGrid(grid);
      drawMardi(grid, pose);

      // ── Bubbles (simulated in dot coords, drawn as braille glyphs) ─
      // Matches mouth position in drawMardi (+27 dots right, +2 dots down).
      const mouthDotX = pose.cx + pose.jitter + 27 * pose.scale;
      const mouthDotY = pose.cy + pose.bob + 2 * pose.scale;

      if (!reduced && m !== "sleeping" && m !== "error") {
        // trickle emission — rate scales with how "alive" he feels
        const rate =
          m === "summoned" ? 2.2 :
          m === "success"  ? 1.8 :
          m === "thinking" ? 0.6 :
                             0.9;
        if (Math.random() < rate * dt) {
          bubbles.push({
            x: mouthDotX,
            y: mouthDotY,
            vx: (Math.random() - 0.5) * 2,
            vy: -2.5 - Math.random() * 1.2,
            age: 0,
            ttl: 1.8 + Math.random() * 0.8,
          });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += dt;
        b.x += b.vx * dt + Math.sin((t + i) * 3) * 0.15;
        b.y += b.vy * dt;
        if (b.age >= b.ttl || b.y < -2) bubbles.splice(i, 1);
      }

      // ── Paint ─────────────────────────────────────────────────────
      ctx.clearRect(0, 0, cssSize, cssSize);

      const inset = 4;
      const charW = (cssSize - inset * 2) / cols;
      const charH = (cssSize - inset * 2) / rows;
      // 0.92 instead of 0.98 gives a touch of air between cells — reads
      // more like a dot-matrix display than a solid typeface.
      const fontPx = charH * 0.96;
      ctx.font = `${fontPx}px "Departure Mono", ui-monospace, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      // colour lerp on mood change (300ms)
      const elapsed = (now - moodChangedAtRef.current) / 300;
      let color = palOf(m);
      if (elapsed < 1 && prevMoodRef.current !== m) {
        color = mix(hexToRgb(palOf(prevMoodRef.current)), hexToRgb(palOf(m)), elapsed);
      } else if (elapsed >= 1) {
        prevMoodRef.current = m;
      }
      ctx.fillStyle = color;

      // Body — pack dot grid → braille, with optional single-row shear.
      for (let row = 0; row < rows; row++) {
        let line = "";
        for (let col = 0; col < cols; col++) {
          let cp = 0x2800;
          for (const [dc, dr, bit] of BRAILLE_LAYOUT) {
            const sy = row * 4 + dr;
            let sx = col * 2 + dc;
            if (shearActive && sy === glitchRow) sx += glitchShift;
            if (sx >= 0 && sx < dotCols && sy >= 0 && sy < dotRows) {
              if (grid.data[sy * dotCols + sx]) cp |= bit;
            }
          }
          line += String.fromCharCode(cp);
        }
        ctx.fillText(line, inset, inset + row * charH);
      }

      // Bubbles — single-dot braille glyphs with fade-out, drawn over body.
      const BUBBLE_GLYPHS = ["⠂", "⠄", "⡀", "⠁", "⠈", "⠐"];
      for (const b of bubbles) {
        const p = b.age / b.ttl;
        const alpha = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 0.95;
        const col = Math.floor(b.x / 2);
        const row = Math.floor(b.y / 4);
        if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
        ctx.globalAlpha = alpha;
        const gi = Math.floor(b.age * 7 + (b.vx + 3)) % BUBBLE_GLYPHS.length;
        ctx.fillText(
          BUBBLE_GLYPHS[Math.abs(gi)],
          inset + col * charW,
          inset + row * charH,
        );
      }
      ctx.globalAlpha = 1;

      // Thinking — a soft vertical scan line that traverses the body, like
      // an old CRT refresh. Drawn as faint dim-cells, NOT full blocks.
      if (!reduced && m === "thinking") {
        const sweep = (Math.sin(t * 1.1) * 0.5 + 0.5); // 0..1
        const scanCol = Math.floor(cols * 0.22 + sweep * cols * 0.55);
        ctx.globalAlpha = 0.45;
        for (let row = 0; row < rows; row++) {
          // only paint where the body already has some dots (so the sweep
          // reads as scanning the fish, not drawing a bar through empty space)
          const hasDots =
            (grid.data[(row * 4) * dotCols + scanCol * 2] ||
              grid.data[(row * 4 + 1) * dotCols + scanCol * 2] ||
              grid.data[(row * 4 + 2) * dotCols + scanCol * 2] ||
              grid.data[(row * 4 + 3) * dotCols + scanCol * 2]);
          if (!hasDots) continue;
          ctx.fillText("⣿", inset + scanCol * charW, inset + row * charH);
        }
        ctx.globalAlpha = 1;
      }

      // Sleeping — tiny Z's drifting up-right from above the head.
      if (!reduced && m === "sleeping") {
        const ZS = ["z", "Z"];
        for (let i = 0; i < 2; i++) {
          const phase = ((t * 0.35) + i * 0.5) % 1;
          const fade =
            phase < 0.15
              ? phase / 0.15
              : phase > 0.8
                ? Math.max(0, 1 - (phase - 0.8) / 0.2)
                : 1;
          ctx.globalAlpha = fade * 0.75;
          const zxDot = pose.cx + 10 * pose.scale + i * 4 + phase * 8;
          const zyDot = pose.cy - 10 * pose.scale - phase * 18;
          ctx.fillText(
            ZS[i % ZS.length],
            inset + (zxDot / 2) * charW,
            inset + (zyDot / 4) * charH,
          );
        }
        ctx.globalAlpha = 1;
      }

      // Corner status pip — a single blinking cursor dot, bottom-right of
      // the canvas. Tiny bit of "live terminal" signal; reads as hi-tech
      // without intruding.
      if (!reduced) {
        const on = Math.floor(t * 1.6) % 2 === 0;
        ctx.globalAlpha = on ? 0.55 : 0.15;
        ctx.fillText(
          "⠁",
          inset + (cols - 1) * charW,
          inset + (rows - 1) * charH,
        );
        ctx.globalAlpha = 1;
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", resize);
      mq.removeEventListener?.("change", onMQ);
    };
  }, [size, responsive, cols, rows, palette]);

  const currentColor = (palette?.[mood] ?? MOOD_COLOR[mood]);

  return (
    <div
      ref={wrapRef}
      className={`relative inline-block ${className}`}
      style={responsive ? { width: "100%", height: "100%" } : { width: size, height: size }}
      aria-label="Mardi, a braille goldfish"
      role="img"
    >
      {glow && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-2xl pointer-events-none pulse-soft"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentColor}33 0%, transparent 62%)`,
            transition: "background 280ms ease-out",
          }}
        />
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}
