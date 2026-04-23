"use client";

import { useEffect, useRef, useState } from "react";

export type MardiMood =
  | "idle"
  | "summoned"
  | "thinking"
  | "success"
  | "error"
  | "sleeping";

type Props = {
  mood?: MardiMood;
  /** Rendered size in px. Canvas is square. */
  size?: number;
  /** Grid of braille chars. 32×16 by default (= 64×64 dot grid). */
  cols?: number;
  rows?: number;
  className?: string;
  /** Soft colored halo behind the glyphs. */
  glow?: boolean;
};

/**
 * Port of MardiFishBrailleView.swift to HTML Canvas.
 * Samples /assets/MardiFish.png once into a 64×64 dot grid, then packs each
 * 2×4 block into a Unicode braille glyph (U+2800 + bitmask) every frame.
 * Adds a vertical bob, a tail wave for the left ~40% of the grid, and three
 * rising bubbles from the mouth. Mood drives the ink color.
 */
export function BrailleFish({
  mood = "idle",
  size = 320,
  cols = 48,
  rows = 24,
  className = "",
  glow = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dots, setDots] = useState<Uint8Array | null>(null);

  const dotCols = cols * 2; // braille is 2-wide
  const dotRows = rows * 4; // braille is 4-tall

  // ── Load + sample the fish PNG once ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/assets/MardiFish.png";
    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0);
      const { data, width: w, height: h } = octx.getImageData(
        0,
        0,
        img.naturalWidth,
        img.naturalHeight
      );
      const grid = new Uint8Array(dotCols * dotRows);
      for (let dy = 0; dy < dotRows; dy++) {
        for (let dx = 0; dx < dotCols; dx++) {
          const sx = Math.min(Math.floor((dx / dotCols) * w), w - 1);
          const sy = Math.min(Math.floor((dy / dotRows) * h), h - 1);
          const off = (sy * w + sx) * 4;
          const r = data[off], g = data[off + 1], b = data[off + 2], a = data[off + 3];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          // The source PNG has a light subject on dark bg; luminance > 0.12.
          grid[dy * dotCols + dx] = a > 20 && lum > 0.12 ? 1 : 0;
        }
      }
      setDots(grid);
    };
    return () => {
      cancelled = true;
    };
  }, [dotCols, dotRows]);

  // ── Render loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!dots) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const start = performance.now();
    let raf = 0;
    let lastFrame = 0;

    const inset = 4;
    const charH = (size - inset * 2) / rows;
    const charW = (size - inset * 2) / cols;

    const color = MOOD_COLOR[mood];
    const bubbleGlyphs = ["⠂", "⠄", "⡀"];
    const mouthDotX = Math.floor(dotCols * 0.63);
    const mouthDotY = Math.floor(dotRows * 0.5);

    const draw = (now: number) => {
      // Throttle to ~20fps (matches the Swift version).
      if (now - lastFrame < 1000 / 20) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, size, size);

      ctx.font = `${charH * 0.98}px "Departure Mono", ui-monospace, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = color;

      const bob = mood === "sleeping" ? 0 : Math.round(Math.sin(t * 1.2) * 2.5);

      for (let row = 0; row < rows; row++) {
        let line = "";
        for (let col = 0; col < cols; col++) {
          const dotX = col * 2;
          const dotY = row * 4;
          // Tail is on the LEFT third.
          const tailFactor = Math.max(0, 1 - col / (cols * 0.4));
          const wave =
            tailFactor > 0.01
              ? Math.round(Math.sin(t * 2.5 + col * 0.5) * tailFactor * 2)
              : 0;
          const yOff = bob + wave;
          let cp = 0x2800;
          for (const [dc, dr, bit] of BRAILLE_LAYOUT) {
            const sx = dotX + dc;
            const sy = dotY + dr + yOff;
            if (sx >= 0 && sx < dotCols && sy >= 0 && sy < dotRows) {
              if (dots[sy * dotCols + sx]) cp |= bit;
            }
          }
          line += String.fromCharCode(cp);
        }
        ctx.fillText(line, inset, inset + row * charH);
      }

      // Bubbles (skip when sleeping).
      if (mood !== "sleeping") {
        for (let i = 0; i < 3; i++) {
          const phase = (t * 0.45 + i * 0.73) % 2.2;
          const progress = phase / 2.2;
          const opacity = progress > 0.82 ? Math.max(0, 1 - (progress - 0.82) / 0.18) : 1;
          const dotY = mouthDotY - Math.round(progress * 14);
          const dotX = mouthDotX + (i === 1 ? 2 : 0);
          const charCol = Math.floor(dotX / 2);
          const charRow = Math.floor(dotY / 4);
          if (charRow < 0 || charRow >= rows) continue;
          if (charCol < 0 || charCol >= cols) continue;
          ctx.globalAlpha = opacity;
          ctx.fillText(
            bubbleGlyphs[i % bubbleGlyphs.length],
            inset + charCol * charW,
            inset + charRow * charH
          );
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [dots, mood, size, cols, rows, dotCols, dotRows]);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-label="Mardi"
      role="img"
    >
      {glow && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-2xl pointer-events-none pulse-soft"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${MOOD_COLOR[mood]}33 0%, transparent 60%)`,
          }}
        />
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}

// Each entry: (dot-col offset, dot-row offset, bit in the U+2800 codepoint).
const BRAILLE_LAYOUT: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0x01], [1, 0, 0x08],
  [0, 1, 0x02], [1, 1, 0x10],
  [0, 2, 0x04], [1, 2, 0x20],
  [0, 3, 0x40], [1, 3, 0x80],
];

const MOOD_COLOR: Record<MardiMood, string> = {
  idle:     "#f3f1ec",      // bone — Mardi is quietly there
  summoned: "#ff2ecc",      // pink — THE accent
  thinking: "#ffb63d",      // gold
  success:  "#3ef0ff",      // cyan
  error:    "#ff3355",      // red
  sleeping: "#6b6860",      // bone-3
};
