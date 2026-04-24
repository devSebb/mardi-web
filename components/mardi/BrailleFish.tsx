"use client";

import { useEffect, useRef } from "react";
import {
  BAYER_4,
  BRAILLE_LAYOUT,
  MOOD_COLOR,
  type MardiMood,
} from "./mardi-art";

export type { MardiMood } from "./mardi-art";

type Props = {
  /** Current mood. Drives colour + motion character. */
  mood?: MardiMood;
  /** Source image to sample. Default: the Mardi goldfish-in-a-bowl PNG. */
  src?: string;
  /** Braille grid width. Dot grid is `cols*2` wide. */
  cols?: number;
  /** Braille grid height. Dot grid is `rows*4` tall. */
  rows?: number;
  /** Soft coloured halo behind the character. */
  glow?: boolean;
  className?: string;
  /** Optional palette override. */
  palette?: Partial<Record<MardiMood, string>>;
};

type Bubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
};

type Sampled = {
  /** 1-bit dots where the fish's warm-hued pixels live. Moves with bob + tail wave. */
  fish: Uint8Array;
  /** 1-bit dots for everything else — the bowl, water, lighting. Static. */
  bowl: Uint8Array;
  /** Auto-detected mouth position in dot coords — the rightmost fish pixel near centre height. */
  mouthX: number;
  mouthY: number;
  /** Left edge of the fish in dot coords — used to localise the tail wave. */
  fishMinX: number;
  fishMaxX: number;
};

/**
 * BrailleFish — Mardi, as a living braille portrait.
 *
 * Samples a source PNG (default: the goldfish-in-a-fishbowl) into a dithered
 * dot grid, segments fish from bowl by hue, and animates only the fish layer:
 * the bowl stays put, Mardi swims inside it.
 *
 * Canvas fills its parent container, which should be square.
 *
 * Reusable: pass a different `src` (and adjust palette if you like) to render
 * any other creature in the same style.
 */
export function BrailleFish({
  mood = "idle",
  src = "/assets/MardiFish.png",
  cols = 56,
  rows = 28,
  glow = true,
  className = "",
  palette,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mood read via ref inside rAF so mood changes don't tear down the loop.
  const moodRef = useRef<MardiMood>(mood);
  moodRef.current = mood;

  const prevMoodRef = useRef<MardiMood>(mood);
  const moodChangedAtRef = useRef<number>(0);
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      moodChangedAtRef.current = performance.now();
    }
  }, [mood]);

  const sampledRef = useRef<Sampled | null>(null);

  // ── Sample + segment the PNG once ───────────────────────────────────
  useEffect(() => {
    const dotCols = cols * 2;
    const dotRows = rows * 4;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0);
      const { data, width: W, height: H } = octx.getImageData(
        0, 0, img.naturalWidth, img.naturalHeight,
      );

      const fish = new Uint8Array(dotCols * dotRows);
      const bowl = new Uint8Array(dotCols * dotRows);

      let mouthX = 0, mouthY = 0, mouthScore = -Infinity;
      let fishMinX = dotCols, fishMaxX = 0;

      // For each dot in the grid, average the source block it covers, then
      // threshold against Bayer 4×4. Classify each lit dot as fish (warm,
      // high-chroma) or bowl (everything else).
      const blockW = W / dotCols;
      const blockH = H / dotRows;

      for (let dy = 0; dy < dotRows; dy++) {
        for (let dx = 0; dx < dotCols; dx++) {
          const sx0 = Math.floor(dx * blockW);
          const sy0 = Math.floor(dy * blockH);
          const sx1 = Math.min(W, Math.ceil((dx + 1) * blockW));
          const sy1 = Math.min(H, Math.ceil((dy + 1) * blockH));

          let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
          for (let y = sy0; y < sy1; y++) {
            for (let x = sx0; x < sx1; x++) {
              const o = (y * W + x) * 4;
              rSum += data[o];
              gSum += data[o + 1];
              bSum += data[o + 2];
              aSum += data[o + 3];
              count++;
            }
          }
          if (count === 0) continue;
          const r = rSum / count;
          const g = gSum / count;
          const b = bSum / count;
          const a = aSum / count;
          if (a < 30) continue;

          // Luminance + a gentle gamma to lift mid-tones (the bowl has a
          // lot of darker glass that we want represented).
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const lifted = Math.pow(lum, 0.72);
          const threshold = BAYER_4[dy & 3][dx & 3];
          if (lifted <= threshold) continue;

          // Fish: warm-dominant (goldfish body = orange/gold, fins = pink).
          const warmScore = (r - b) + Math.max(0, r - g);
          const isFish = warmScore > 50 && r > 120;
          // Exclude the very bright pink bowl RIM by requiring the green
          // channel to be reasonable (bowl rim is high-R high-B low-G).
          const bowlRim = r > 200 && b > 150 && g < 90;
          if (isFish && !bowlRim) {
            fish[dy * dotCols + dx] = 1;
            if (dx < fishMinX) fishMinX = dx;
            if (dx > fishMaxX) fishMaxX = dx;
            // Score rightmost fish pixels near mid-height highest — that's the mouth.
            const score = dx * 3 - Math.abs(dy - dotRows * 0.48) * 4;
            if (score > mouthScore) {
              mouthScore = score;
              mouthX = dx;
              mouthY = dy;
            }
          } else {
            bowl[dy * dotCols + dx] = 1;
          }
        }
      }

      sampledRef.current = { fish, bowl, mouthX, mouthY, fishMinX, fishMaxX };
    };

    return () => {
      cancelled = true;
    };
  }, [src, cols, rows]);

  // ── Render loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotCols = cols * 2;
    const dotRows = rows * 4;
    const composed = new Uint8Array(dotCols * dotRows);

    let cssW = 0, cssH = 0;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("resize", resize);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    const onMQ = () => {
      reduced = mq.matches;
    };
    mq.addEventListener?.("change", onMQ);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

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

    const start = performance.now();
    let raf = 0;
    let lastFrame = 0;
    let nextBlink = 2.4 + Math.random() * 4;
    let blinkUntil = 0;
    let nextGlitch = 8 + Math.random() * 14;
    let glitchUntil = 0;
    let glitchRow = -1;
    let glitchShift = 0;

    const bubbles: Bubble[] = [];
    let prevM: MardiMood = moodRef.current;

    const BUBBLE_GLYPHS = ["⠂", "⠄", "⡀", "⠁", "⠈", "⠐"];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (now - lastFrame < 1000 / 24) return;
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;

      const sampled = sampledRef.current;
      if (!sampled) {
        ctx.clearRect(0, 0, cssW, cssH);
        return;
      }

      const t = (now - start) / 1000;
      const m = moodRef.current;

      // ── Motion parameters per mood ─────────────────────────────────
      const bobFreq = m === "error" ? 8 : m === "summoned" ? 1.8 : m === "sleeping" ? 0.4 : 1.2;
      const bobAmp = reduced ? 0 : m === "sleeping" ? 1 : m === "error" ? 0.8 : m === "summoned" ? 1.4 : 2.2;
      const bob = Math.round(Math.sin(t * bobFreq) * bobAmp);
      const tailFreq = m === "thinking" ? 1.4 : m === "summoned" ? 4.2 : m === "sleeping" ? 0.6 : 2.8;
      const tailPhase = reduced ? 0 : Math.sin(t * tailFreq);
      const jitter = !reduced && m === "error" ? Math.round(Math.sin(t * 38) * 1.5) : 0;

      // ── Blink ──────────────────────────────────────────────────────
      if (t > nextBlink && blinkUntil === 0 && m !== "sleeping") {
        blinkUntil = t + 0.14;
        nextBlink = t + (m === "error" ? 0.5 : 3 + Math.random() * 5);
      }
      const blinking = t < blinkUntil;
      if (!blinking && blinkUntil > 0) blinkUntil = 0;

      // ── Glitch shear ───────────────────────────────────────────────
      if (!reduced && t > nextGlitch) {
        glitchRow = Math.floor(Math.random() * dotRows);
        glitchShift = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2));
        glitchUntil = t + 0.06;
        nextGlitch = t + 10 + Math.random() * 14;
      }
      const shearActive = t < glitchUntil;

      // ── Bubble emission ────────────────────────────────────────────
      if (m !== prevM) {
        const count = m === "success" ? 9 : m === "summoned" ? 4 : 0;
        for (let i = 0; i < count; i++) {
          bubbles.push({
            x: sampled.mouthX + (Math.random() - 0.5) * 4,
            y: sampled.mouthY + bob + (Math.random() - 0.5) * 2,
            vx: (Math.random() - 0.5) * 6,
            vy: -4 - Math.random() * 3,
            age: 0,
            ttl: 1.5 + Math.random() * 0.7,
          });
        }
        prevM = m;
      }
      if (!reduced && m !== "sleeping" && m !== "error") {
        const rate =
          m === "summoned" ? 2.2 :
          m === "success"  ? 1.6 :
          m === "thinking" ? 0.5 :
                             0.9;
        if (Math.random() < rate * dt) {
          bubbles.push({
            x: sampled.mouthX,
            y: sampled.mouthY + bob,
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
        b.x += b.vx * dt + Math.sin((t + i) * 3) * 0.18;
        b.y += b.vy * dt;
        if (b.age >= b.ttl || b.y < -2) bubbles.splice(i, 1);
      }

      // ── Compose: bowl (static) + fish (bob + tail wave + jitter) ──
      composed.fill(0);
      composed.set(sampled.bowl);

      const fishWidth = Math.max(1, sampled.fishMaxX - sampled.fishMinX);
      // Tail wave acts on the leftmost ~45% of the fish's own bounding box.
      for (let dy = 0; dy < dotRows; dy++) {
        for (let dx = 0; dx < dotCols; dx++) {
          if (!sampled.fish[dy * dotCols + dx]) continue;
          const normX = (dx - sampled.fishMinX) / fishWidth; // 0 at tail, 1 at mouth
          const tailFactor = Math.max(0, 1 - normX / 0.45);
          const wave = Math.round(tailPhase * 2 * tailFactor);
          const tx = dx + jitter;
          const ty = dy + bob + wave;
          if (tx < 0 || tx >= dotCols || ty < 0 || ty >= dotRows) continue;
          composed[ty * dotCols + tx] = 1;
        }
      }

      // Blink / sleep: clear a short strip above the mouth, at fish eye height.
      if (blinking || m === "sleeping") {
        const eyeX = sampled.mouthX - Math.round(dotCols * 0.08);
        const eyeY = sampled.mouthY + bob - Math.round(dotRows * 0.05);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ex = eyeX + dx;
            const ey = eyeY + dy;
            if (ex < 0 || ex >= dotCols || ey < 0 || ey >= dotRows) continue;
            composed[ey * dotCols + ex] = dy === 0 ? 1 : 0;
          }
        }
      }

      // ── Paint ─────────────────────────────────────────────────────
      ctx.clearRect(0, 0, cssW, cssH);

      const charW = cssW / cols;
      const charH = cssH / rows;
      const fontPx = charH * 0.98;
      ctx.font = `${fontPx}px "Departure Mono", ui-monospace, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      // Mood colour with a 300ms cross-fade.
      const elapsed = (now - moodChangedAtRef.current) / 300;
      let color = palOf(m);
      if (elapsed < 1 && prevMoodRef.current !== m) {
        color = mix(hexToRgb(palOf(prevMoodRef.current)), hexToRgb(palOf(m)), elapsed);
      } else if (elapsed >= 1) {
        prevMoodRef.current = m;
      }
      ctx.fillStyle = color;

      for (let row = 0; row < rows; row++) {
        let line = "";
        for (let col = 0; col < cols; col++) {
          let cp = 0x2800;
          for (const [dc, dr, bit] of BRAILLE_LAYOUT) {
            const sy = row * 4 + dr;
            let sx = col * 2 + dc;
            if (shearActive && sy === glitchRow) sx += glitchShift;
            if (sx >= 0 && sx < dotCols && sy >= 0 && sy < dotRows) {
              if (composed[sy * dotCols + sx]) cp |= bit;
            }
          }
          line += String.fromCharCode(cp);
        }
        ctx.fillText(line, 0, row * charH);
      }

      // ── Overlays ──────────────────────────────────────────────────
      for (const b of bubbles) {
        const p = b.age / b.ttl;
        const alpha = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 0.95;
        const col = Math.floor(b.x / 2);
        const row = Math.floor(b.y / 4);
        if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
        ctx.globalAlpha = alpha;
        const gi = Math.abs(Math.floor(b.age * 7 + (b.vx + 3))) % BUBBLE_GLYPHS.length;
        ctx.fillText(BUBBLE_GLYPHS[gi], col * charW, row * charH);
      }
      ctx.globalAlpha = 1;

      if (!reduced && m === "sleeping") {
        for (let i = 0; i < 2; i++) {
          const phase = ((t * 0.35) + i * 0.5) % 1;
          const fade =
            phase < 0.15 ? phase / 0.15 :
            phase > 0.8  ? Math.max(0, 1 - (phase - 0.8) / 0.2) :
                           1;
          ctx.globalAlpha = fade * 0.75;
          const zxDot = sampled.mouthX - 18 + i * 4 + phase * 10;
          const zyDot = sampled.mouthY - 12 - phase * 20;
          ctx.fillText(
            i % 2 === 0 ? "z" : "Z",
            (zxDot / 2) * charW,
            (zyDot / 4) * charH,
          );
        }
        ctx.globalAlpha = 1;
      }

      if (!reduced) {
        const on = Math.floor(t * 1.6) % 2 === 0;
        ctx.globalAlpha = on ? 0.55 : 0.15;
        ctx.fillText("⠁", (cols - 1) * charW, (rows - 1) * charH);
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
  }, [cols, rows, palette]);

  const currentColor = palette?.[mood] ?? MOOD_COLOR[mood];

  return (
    <div
      ref={wrapRef}
      className={`relative block w-full h-full ${className}`}
      aria-label="Mardi, a braille goldfish in a fishbowl"
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
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
