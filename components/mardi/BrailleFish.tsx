"use client";

import { useEffect, useRef } from "react";
import {
  BRAILLE_LAYOUT,
  MOOD_COLOR,
  type MardiMood,
} from "./mardi-art";
import {
  buildMardiSprite,
  type MardiSprite,
  type MouthShape,
  type PupilDir,
} from "./mardi-sprite";

export type { MardiMood } from "./mardi-art";

// ── Per-mood face state ──────────────────────────────────────────────

function pupilFor(m: MardiMood, t: number): PupilDir {
  switch (m) {
    case "idle":
      // Drifts gently between centre and slightly-left.
      return Math.sin(t * 0.4) > 0.6 ? "left" : "center";
    case "summoned":
      return "upRight";
    case "thinking":
      return Math.sin(t * 0.7) > 0 ? "up" : "upLeft";
    case "success":
      return "right";
    case "error":
      return "down";
    case "sleeping":
      return "center";
  }
}

function mouthFor(
  m: MardiMood,
  t: number,
  inReaction: boolean,
  moodAge: number,
): MouthShape {
  if (m === "sleeping" && inReaction && moodAge < 0.30) return "yawn";
  switch (m) {
    case "idle":     return Math.sin(t * 0.55) > 0.4 ? "o" : "neutral";
    case "summoned": return "o";
    case "thinking": return Math.sin(t * 0.7) > 0 ? "o" : "neutral";
    case "success":  return "smile";
    case "error":    return "x";
    case "sleeping": return "o";
  }
}


/** Fractional insets (0..1) leaving breathing room around the character. */
export type BrailleInset = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type Props = {
  /** Current mood. Drives colour + motion character. */
  mood?: MardiMood;
  /** Braille grid width. Dot grid is `cols*2` wide. */
  cols?: number;
  /** Braille grid height. Dot grid is `rows*4` tall. */
  rows?: number;
  /** Soft coloured halo behind the character. */
  glow?: boolean;
  className?: string;
  /** Optional palette override. */
  palette?: Partial<Record<MardiMood, string>>;
  /**
   * Padding between the character and the container edges, as fractions of
   * the container's width/height. Lets callers reserve room for chrome or
   * caption overlays. Defaults to a small symmetric inset on all sides.
   */
  inset?: BrailleInset;
};

type Bubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
};

/**
 * BrailleFish — Mardi, as a living braille portrait.
 *
 * The bowl, the fish, and its swim cycle are generated procedurally as dot
 * arrays; the renderer composes a static bowl layer with one of N pre-built
 * fish frames (selected by tail phase), then applies bob, blink, glitch and
 * mouth-bubbles on top before packing dots into braille glyphs.
 *
 * Canvas fills its parent container, which should be square.
 */
export function BrailleFish({
  mood = "idle",
  cols = 56,
  rows = 28,
  glow = true,
  className = "",
  palette,
  inset,
}: Props) {
  const insetTop = inset?.top ?? 0.04;
  const insetRight = inset?.right ?? 0.04;
  const insetBottom = inset?.bottom ?? 0.04;
  const insetLeft = inset?.left ?? 0.04;
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

  const spriteRef = useRef<MardiSprite | null>(null);

  // ── Build sprite (bowl + fish frames) ────────────────────────────────
  useEffect(() => {
    spriteRef.current = buildMardiSprite(cols * 2, rows * 4);
  }, [cols, rows]);

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

    const FONT = `"Departure Mono", ui-monospace, Menlo, monospace`;

    // Rendered grid metrics, recomputed on resize. The grid is a square
    // fitted into the container's safe-area (container minus insets); the
    // character is drawn cell-by-cell so glyph advance can never clip the
    // right edge the way batched row draws do.
    let cssW = 0, cssH = 0;
    let boxX = 0, boxY = 0;
    let charW = 0, charH = 0;
    let fontPx = 0;

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

      const padL = cssW * insetLeft;
      const padR = cssW * insetRight;
      const padT = cssH * insetTop;
      const padB = cssH * insetBottom;
      const availW = Math.max(1, cssW - padL - padR);
      const availH = Math.max(1, cssH - padT - padB);
      // Dot grid is square (cols*2 === rows*4 by default), so fit a square.
      const boxSide = Math.min(availW, availH);
      boxX = padL + (availW - boxSide) / 2;
      boxY = padT + (availH - boxSide) / 2;
      charW = boxSide / cols;
      charH = boxSide / rows;

      // Pick the largest fontPx that still fits a glyph inside one cell.
      // Measured once per resize — the font cascade is stable for braille.
      const refPx = 100;
      ctx.font = `${refPx}px ${FONT}`;
      const m = ctx.measureText("⣿");
      const refAdvance = m.width || refPx * 0.6;
      const refHeight =
        (m.fontBoundingBoxAscent ?? refPx * 0.8) +
        (m.fontBoundingBoxDescent ?? refPx * 0.2);
      const fontPxByW = (refPx * charW) / refAdvance;
      const fontPxByH = (refPx * charH) / refHeight;
      fontPx = Math.min(fontPxByW, fontPxByH);
    };
    resize();
    // Web fonts can land after first measure — remeasure once they're ready.
    document.fonts?.ready?.then(() => resize()).catch(() => {});
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

    // Bubble lifecycle: starts as a single dot from the mouth, grows as it
    // rises (denoting expansion at lower pressure / "filling out"), then
    // fades to nothing. Picked by age progression so each bubble grows
    // smoothly rather than flickering between sizes.
    const BUBBLE_GLYPHS = ["⠂", "⠆", "⠒", "⠶", "⠿"];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (now - lastFrame < 1000 / 24) return;
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;

      const sprite = spriteRef.current;
      if (!sprite) {
        ctx.clearRect(0, 0, cssW, cssH);
        return;
      }

      const t = (now - start) / 1000;
      const m = moodRef.current;
      const moodAge = (now - moodChangedAtRef.current) / 1000;
      const inReaction = moodAge < 0.5;

      // ── Motion parameters per mood ─────────────────────────────────
      const bobFreq = m === "error" ? 8 : m === "summoned" ? 1.8 : m === "sleeping" ? 0.4 : 1.2;
      const bobAmp = reduced ? 0 : m === "sleeping" ? 1 : m === "error" ? 0.8 : m === "summoned" ? 1.4 : 2.2;
      let bob = Math.round(Math.sin(t * bobFreq) * bobAmp);
      const tailFreq = m === "thinking" ? 1.4 : m === "summoned" ? 4.2 : m === "sleeping" ? 0.6 : 2.8;

      const tailIdx = reduced
        ? 0
        : Math.floor(((t * tailFreq) / (Math.PI * 2)) * sprite.tailFrames.length) % sprite.tailFrames.length;
      const tailFrame = sprite.tailFrames[(tailIdx + sprite.tailFrames.length) % sprite.tailFrames.length];

      const pecFreq = m === "summoned" ? 5.0 : m === "thinking" ? 1.4 : m === "sleeping" ? 0.5 : 3.5;
      const pecIdx = reduced
        ? 0
        : Math.floor(((t * pecFreq) / (Math.PI * 2)) * sprite.pectoralFrames.length) % sprite.pectoralFrames.length;
      const pectoralFrame = sprite.pectoralFrames[(pecIdx + sprite.pectoralFrames.length) % sprite.pectoralFrames.length];

      let jitter = !reduced && m === "error" ? Math.round(Math.sin(t * 38) * 1.5) : 0;

      // One-shot mood-entry reactions (first 500ms after a transition).
      if (inReaction && !reduced) {
        const k = Math.sin((moodAge / 0.5) * Math.PI); // 0 → 1 → 0
        switch (m) {
          case "summoned":
            bob -= Math.round(k * 3); // dart up then settle
            break;
          case "error":
            jitter += Math.round(Math.sin(moodAge * 60) * 2 * k);
            break;
          case "success":
            // wink handled below by forcing blink early
            break;
          default:
            break;
        }
      }

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
            x: sprite.mouthBubbleX + (Math.random() - 0.5) * 4,
            y: sprite.mouthBubbleY + bob + (Math.random() - 0.5) * 2,
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
            x: sprite.mouthBubbleX,
            y: sprite.mouthBubbleY + bob,
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

      // ── Compose: bowl → opaque body → tail/pectoral overlays → face ──
      composed.fill(0);
      composed.set(sprite.bowl);

      const fishOriginX = sprite.fishX + jitter;
      const fishOriginY = sprite.fishY + bob;
      const fW = sprite.fishW;
      const fH = sprite.fishH;

      // Tail (translucent — drawn first so the body overlaps the tail base).
      for (let fy = 0; fy < fH; fy++) {
        const ty = fishOriginY + fy;
        if (ty < 0 || ty >= dotRows) continue;
        for (let fx = 0; fx < fW; fx++) {
          if (!tailFrame[fy * fW + fx]) continue;
          const tx = fishOriginX + fx;
          if (tx < 0 || tx >= dotCols) continue;
          composed[ty * dotCols + tx] = 1;
        }
      }

      // Body (opaque — mask CLEARS bowl under fish silhouette, base sets pattern).
      for (let fy = 0; fy < fH; fy++) {
        const ty = fishOriginY + fy;
        if (ty < 0 || ty >= dotRows) continue;
        for (let fx = 0; fx < fW; fx++) {
          if (!sprite.bodyMask[fy * fW + fx]) continue;
          const tx = fishOriginX + fx;
          if (tx < 0 || tx >= dotCols) continue;
          composed[ty * dotCols + tx] = sprite.bodyBase[fy * fW + fx];
        }
      }

      // Pectoral fin (translucent — drawn over belly).
      for (let fy = 0; fy < fH; fy++) {
        const ty = fishOriginY + fy;
        if (ty < 0 || ty >= dotRows) continue;
        for (let fx = 0; fx < fW; fx++) {
          if (!pectoralFrame[fy * fW + fx]) continue;
          const tx = fishOriginX + fx;
          if (tx < 0 || tx >= dotCols) continue;
          composed[ty * dotCols + tx] = 1;
        }
      }

      // ── Face: pupil ─────────────────────────────────────────────────
      const eyeClosed =
        blinking ||
        m === "sleeping" ||
        (m === "success" && inReaction && moodAge < 0.18); // wink on success entry

      if (!eyeClosed) {
        const dir = pupilFor(m, t);
        const [pdx, pdy] = sprite.pupilOffset[dir];
        // Add micro-saccade — tiny 1-dot jitter every few seconds.
        const sacc = Math.floor(t * 0.3) % 7 === 0 ? Math.sign(Math.sin(t * 11)) : 0;
        const px = fishOriginX + sprite.eyeX + pdx + sacc;
        const py = fishOriginY + sprite.eyeY + pdy;
        if (px >= 0 && px < dotCols && py >= 0 && py < dotRows) {
          composed[py * dotCols + px] = 1;
        }
      } else {
        // Eyelid line through eye centre — spans the full eye width.
        const eGX = fishOriginX + sprite.eyeX;
        const eGY = fishOriginY + sprite.eyeY;
        for (let dx = -3; dx <= 3; dx++) {
          const ex = eGX + dx;
          if (ex >= 0 && ex < dotCols && eGY >= 0 && eGY < dotRows) {
            composed[eGY * dotCols + ex] = 1;
          }
        }
      }

      // ── Face: mouth ─────────────────────────────────────────────────
      const mouthShape = mouthFor(m, t, inReaction, moodAge);
      const mp = sprite.mouthShapes[mouthShape];
      for (let my = 0; my < sprite.mouthShapeH; my++) {
        const ty = fishOriginY + sprite.mouthY + my;
        if (ty < 0 || ty >= dotRows) continue;
        for (let mx = 0; mx < sprite.mouthShapeW; mx++) {
          if (!mp[my * sprite.mouthShapeW + mx]) continue;
          const tx = fishOriginX + sprite.mouthX + mx;
          if (tx < 0 || tx >= dotCols) continue;
          composed[ty * dotCols + tx] = 1;
        }
      }

      // ── Face: blush dots on success ─────────────────────────────────
      if (m === "success") {
        const bx = fishOriginX + sprite.blushX;
        const by = fishOriginY + sprite.blushY;
        if (bx >= 0 && bx < dotCols && by >= 0 && by < dotRows) {
          composed[by * dotCols + bx] = 1;
        }
        if (bx + 6 >= 0 && bx + 6 < dotCols) {
          composed[by * dotCols + (bx + 6)] = 1;
        }
      }

      // ── Paint ─────────────────────────────────────────────────────
      ctx.clearRect(0, 0, cssW, cssH);

      ctx.font = `${fontPx}px ${FONT}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Mood colour with a 300ms cross-fade.
      const elapsed = (now - moodChangedAtRef.current) / 300;
      let color = palOf(m);
      if (elapsed < 1 && prevMoodRef.current !== m) {
        color = mix(hexToRgb(palOf(prevMoodRef.current)), hexToRgb(palOf(m)), elapsed);
      } else if (elapsed >= 1) {
        prevMoodRef.current = m;
      }
      ctx.fillStyle = color;

      // Per-cell draw at cell centres — the glyph's own advance metric is
      // irrelevant because we position each character explicitly.
      for (let row = 0; row < rows; row++) {
        const cy = boxY + (row + 0.5) * charH;
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
          if (cp === 0x2800) continue;
          ctx.fillText(String.fromCharCode(cp), boxX + (col + 0.5) * charW, cy);
        }
      }

      // ── Overlays ──────────────────────────────────────────────────
      for (const b of bubbles) {
        const p = b.age / b.ttl;
        const alpha = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 1;
        const col = Math.floor(b.x / 2);
        const row = Math.floor(b.y / 4);
        if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
        ctx.globalAlpha = alpha;
        const gi = Math.min(
          BUBBLE_GLYPHS.length - 1,
          Math.floor(p * BUBBLE_GLYPHS.length),
        );
        ctx.fillText(
          BUBBLE_GLYPHS[gi],
          boxX + (col + 0.5) * charW,
          boxY + (row + 0.5) * charH,
        );
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
          const zxDot = sprite.mouthX - 18 + i * 4 + phase * 10;
          const zyDot = sprite.mouthY - 12 - phase * 20;
          ctx.fillText(
            i % 2 === 0 ? "z" : "Z",
            boxX + (zxDot / 2 + 0.5) * charW,
            boxY + (zyDot / 4 + 0.5) * charH,
          );
        }
        ctx.globalAlpha = 1;
      }

      if (!reduced) {
        const on = Math.floor(t * 1.6) % 2 === 0;
        ctx.globalAlpha = on ? 0.55 : 0.15;
        ctx.fillText(
          "⠁",
          boxX + (cols - 0.5) * charW,
          boxY + (rows - 0.5) * charH,
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
  }, [cols, rows, palette, insetTop, insetRight, insetBottom, insetLeft]);

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
