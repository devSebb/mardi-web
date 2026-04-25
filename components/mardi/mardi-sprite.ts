/**
 * Mardi sprite — procedural braille goldfish-bowl, chibi edition.
 *
 * No PNG sampling. The bowl, fish body, fins, tail and face are all built
 * directly into dot grids. The renderer composes layers each frame:
 *   bowl (static)
 *     → body silhouette CLEARS bowl in fish footprint (so body is opaque)
 *     → body pattern (scales + belly stipple + dorsal + anal + cheek glint)
 *     → tail frame (translucent — does not clear bowl)
 *     → pectoral fin frame (translucent)
 *     → pupil dot (mood + saccade driven)
 *     → mouth stencil (mood + breath driven)
 *     → blink/sleep eyelid line
 *
 * Coordinates are in DOTS. Origin is top-left.
 */

import { BAYER_4 } from "./mardi-art";

export type MouthShape = "neutral" | "o" | "smile" | "frown" | "x" | "yawn";
export type PupilDir =
  | "center"
  | "left"
  | "right"
  | "up"
  | "down"
  | "upLeft"
  | "upRight";

export type MardiSprite = {
  /** Static bowl + glass dither + stand + water surface + idle bubbles. */
  bowl: Uint8Array;

  // ── Fish, all in fish-local coords (fishW × fishH) ──────────────────
  /** Body silhouette mask — used to clear bowl behind the body so it's opaque. */
  bodyMask: Uint8Array;
  /** Body pattern: ellipse + scale stipple + belly + dorsal/anal fins + cheek glint. Eye whites already cleared. */
  bodyBase: Uint8Array;
  /** Tail frames, drawn translucently behind the body. */
  tailFrames: Uint8Array[];
  /** Pectoral fin frames, drawn translucently in front of belly. */
  pectoralFrames: Uint8Array[];

  fishW: number;
  fishH: number;
  /** Where (top-left) the fish sits within the bowl grid. */
  fishX: number;
  fishY: number;

  // ── Face anchors (fish-local) ───────────────────────────────────────
  /** Eye centre — pupil is drawn at eye + pupilOffset[dir]. */
  eyeX: number;
  eyeY: number;
  pupilOffset: Record<PupilDir, [number, number]>;
  /** Top-left of the mouth stencil (3×3). */
  mouthX: number;
  mouthY: number;
  mouthShapes: Record<MouthShape, Uint8Array>;
  mouthShapeW: number;
  mouthShapeH: number;
  /** Cheek-blush dot position (fish-local) for success mood. */
  blushX: number;
  blushY: number;

  // ── Bubble emit point (bowl-grid coords, accounting for fish placement) ──
  mouthBubbleX: number;
  mouthBubbleY: number;
};

// ── Drawing primitives ────────────────────────────────────────────────

const setDot = (g: Uint8Array, W: number, H: number, x: number, y: number) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi >= 0 && xi < W && yi >= 0 && yi < H) g[yi * W + xi] = 1;
};

const clearDot = (g: Uint8Array, W: number, H: number, x: number, y: number) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi >= 0 && xi < W && yi >= 0 && yi < H) g[yi * W + xi] = 0;
};

function fillTri(
  g: Uint8Array,
  W: number,
  H: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
  const denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  if (Math.abs(denom) < 1e-6) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / denom;
      const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / denom;
      const c = 1 - a - b;
      if (a >= 0 && b >= 0 && c >= 0) g[y * W + x] = 1;
    }
  }
}

function fillQuad(
  g: Uint8Array,
  W: number, H: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
) {
  // Two triangles. Quad order: TL, TR, BR, BL (or any consistent winding).
  fillTri(g, W, H, x0, y0, x1, y1, x2, y2);
  fillTri(g, W, H, x0, y0, x2, y2, x3, y3);
}

function arc(
  g: Uint8Array,
  W: number, H: number,
  cx: number, cy: number,
  rx: number, ry: number,
  fromTheta: number, toTheta: number,
  step = 0.005,
) {
  for (let t = fromTheta; t <= toTheta; t += step) {
    setDot(g, W, H, cx + Math.cos(t) * rx, cy + Math.sin(t) * ry);
  }
}

// ── Bowl (unchanged from previous version) ────────────────────────────

function buildBowl(dotCols: number, dotRows: number): {
  bowl: Uint8Array;
  centerX: number;
  bodyCY: number;
  bodyR: number;
} {
  const bowl = new Uint8Array(dotCols * dotRows);
  const cx = dotCols / 2;
  const cy = dotRows * 0.555;
  const bodyR = Math.min(dotCols, dotRows) * 0.405;

  arc(bowl, dotCols, dotRows, cx, cy, bodyR, bodyR, Math.PI * 0.18, Math.PI * 0.82, 0.004);
  arc(bowl, dotCols, dotRows, cx, cy, bodyR, bodyR, Math.PI * 0.82, Math.PI * 1.0, 0.004);
  arc(bowl, dotCols, dotRows, cx, cy, bodyR, bodyR, Math.PI * 1.0, Math.PI * 1.18, 0.004);
  arc(bowl, dotCols, dotRows, cx, cy, bodyR, bodyR, Math.PI * 1.82, Math.PI * 2.0, 0.004);

  arc(bowl, dotCols, dotRows, cx, cy, bodyR - 2, bodyR - 2, Math.PI * 1.02, Math.PI * 1.18, 0.02);

  const rimY = cy - bodyR * 0.985;
  const rimRX = bodyR * 0.58;
  const rimRY = 2.2;
  arc(bowl, dotCols, dotRows, cx, rimY,       rimRX,        rimRY,        0, Math.PI * 2, 0.04);
  arc(bowl, dotCols, dotRows, cx, rimY + 1.6, rimRX * 0.95, rimRY * 0.85, 0, Math.PI,     0.04);

  const standY = cy + bodyR + 1.8;
  const standRX = bodyR * 0.46;
  const standRY = 2.0;
  arc(bowl, dotCols, dotRows, cx, standY, standRX, standRY, 0, Math.PI * 2, 0.04);
  for (let dy = 0; dy < 2; dy++) {
    for (let x = -standRX * 0.85; x <= standRX * 0.85; x++) {
      setDot(bowl, dotCols, dotRows, cx + x, standY + dy);
    }
  }
  const slitW = standRX * 0.55;
  for (let x = -slitW; x <= slitW; x++) {
    if ((Math.round(x) & 1) === 0) {
      setDot(bowl, dotCols, dotRows, cx + x, standY + 1);
    }
  }

  for (let y = 0; y < dotRows; y++) {
    for (let x = 0; x < dotCols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < bodyR - 1.5) {
        const b = BAYER_4[y & 3][x & 3];
        if (b > 0.86) bowl[y * dotCols + x] = 1;
      }
    }
  }

  const waterY = cy - bodyR * 0.62;
  const half = Math.sqrt(Math.max(0, bodyR * bodyR - (waterY - cy) * (waterY - cy))) - 1;
  for (let dx = -half; dx <= half; dx++) {
    if ((Math.round(dx) & 1) === 0) setDot(bowl, dotCols, dotRows, cx + dx, waterY);
  }

  const idleBubbles: Array<[number, number]> = [
    [cx + bodyR * 0.45, cy - bodyR * 0.18],
    [cx + bodyR * 0.55, cy - bodyR * 0.34],
    [cx + bodyR * 0.40, cy - bodyR * 0.50],
    [cx + bodyR * 0.50, cy - bodyR * 0.05],
  ];
  for (const [x, y] of idleBubbles) setDot(bowl, dotCols, dotRows, x, y);

  return { bowl, centerX: cx, bodyCY: cy, bodyR };
}

// ── Body ──────────────────────────────────────────────────────────────

type BodyGeom = {
  bcx: number; bcy: number;
  brx: number; bry: number;
  eyeCX: number; eyeCY: number;
  mouthX: number; mouthY: number;
  blushX: number; blushY: number;
  pectoralBaseX: number; pectoralBaseY: number;
};

function bodyGeom(W: number, H: number): BodyGeom {
  const bcx = W * 0.62;
  const bcy = H * 0.50;
  const brx = W * 0.32;
  const bry = H * 0.40;
  return {
    bcx, bcy, brx, bry,
    eyeCX: bcx + brx * 0.50,
    eyeCY: bcy - bry * 0.32,
    mouthX: Math.round(bcx + brx * 0.78),
    mouthY: Math.round(bcy + bry * 0.10),
    blushX: Math.round(bcx + brx * 0.32),
    blushY: Math.round(bcy + bry * 0.18),
    pectoralBaseX: bcx + brx * 0.18,
    pectoralBaseY: bcy + bry * 0.42,
  };
}

function buildBodyLayers(W: number, H: number) {
  const mask = new Uint8Array(W * H);
  const base = new Uint8Array(W * H);
  const g = bodyGeom(W, H);
  const { bcx, bcy, brx, bry, eyeCX, eyeCY } = g;

  // Body silhouette: solid ellipse — written into BOTH mask and base.
  // Mask is the opaque footprint; base is the visible pattern.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ndx = (x - bcx) / brx;
      const ndy = (y - bcy) / bry;
      if (ndx * ndx + ndy * ndy <= 1) {
        mask[y * W + x] = 1;
        // Belly: lower 60% of body gets sparse dither for "lighter underside".
        if (ndy > 0.10) {
          if (BAYER_4[y & 3][x & 3] < 0.60) base[y * W + x] = 1;
        } else {
          base[y * W + x] = 1;
        }
      }
    }
  }

  // Scale stipple: brick-staggered cleared dots in body interior, suggests scale rows.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!base[y * W + x]) continue;
      const ndx = (x - bcx) / brx;
      const ndy = (y - bcy) / bry;
      if (ndx * ndx + ndy * ndy > 0.65) continue; // keep silhouette edges solid
      const stagger = (Math.floor((y + 0) / 2) % 2) === 0 ? 0 : 2;
      if ((x + stagger) % 4 === 0 && (y % 2) === 0) base[y * W + x] = 0;
    }
  }

  // Dorsal fin — soft triangle with a bump on the trailing edge.
  const dfCX = bcx - brx * 0.15;
  const dfBaseHalf = brx * 0.34;
  const dfBaseY = bcy - bry + 0.5;
  const dfTipY = dfBaseY - 4;
  fillTri(
    base, W, H,
    dfCX - dfBaseHalf, dfBaseY,
    dfCX + dfBaseHalf, dfBaseY,
    dfCX + 0.5, dfTipY,
  );
  // Dorsal fin: sparse interior so it reads as fin tissue not solid.
  for (let y = Math.floor(dfTipY); y <= Math.ceil(dfBaseY); y++) {
    for (let x = Math.floor(dfCX - dfBaseHalf); x <= Math.ceil(dfCX + dfBaseHalf); x++) {
      if (!base[y * W + x]) continue;
      if (mask[y * W + x]) continue; // body region — leave alone
      if (BAYER_4[y & 3][x & 3] > 0.55) base[y * W + x] = 0;
    }
  }
  // Mark dorsal fin as opaque so the bowl doesn't show through it.
  fillTri(
    mask, W, H,
    dfCX - dfBaseHalf, dfBaseY,
    dfCX + dfBaseHalf, dfBaseY,
    dfCX + 0.5, dfTipY,
  );

  // Anal fin — smaller triangle below body.
  const afCX = bcx + brx * 0.05;
  const afBaseHalf = brx * 0.22;
  const afBaseY = bcy + bry - 0.3;
  const afTipY = afBaseY + 2.5;
  fillTri(
    base, W, H,
    afCX - afBaseHalf, afBaseY,
    afCX + afBaseHalf, afBaseY,
    afCX, afTipY,
  );
  fillTri(
    mask, W, H,
    afCX - afBaseHalf, afBaseY,
    afCX + afBaseHalf, afBaseY,
    afCX, afTipY,
  );

  // Eye whites: 7×5 oval cleared from the body, corners rounded so it reads
  // as a circle rather than a rectangle. The whites stay empty (body mask
  // still claims these cells — bowl can't bleed through).
  const eyeRX = 3;
  const eyeRY = 2;
  for (let dy = -eyeRY; dy <= eyeRY; dy++) {
    for (let dx = -eyeRX; dx <= eyeRX; dx++) {
      // Drop the 4 outermost corners + the next-in cells on the top/bottom rows.
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax === eyeRX && ay === eyeRY) continue;        // hard corners
      if (ax === eyeRX && ay === eyeRY - 1) continue;    // soften further
      if (ax === eyeRX - 1 && ay === eyeRY) continue;
      clearDot(base, W, H, eyeCX + dx, eyeCY + dy);
    }
  }

  // Cheek glint — single lit dot below the (now larger) eye.
  setDot(base, W, H, Math.round(eyeCX - 1), Math.round(eyeCY + 3));

  // Highlight on body's upper curve — single lit dot near the top edge.
  setDot(base, W, H, Math.round(bcx + brx * 0.10), Math.round(bcy - bry * 0.78));

  return { mask, base, geom: g };
}

// ── Tail ──────────────────────────────────────────────────────────────

/** Fill a rotated, axis-aligned ellipse at (cx, cy) with semi-axes a, b. */
function fillRotatedEllipse(
  g: Uint8Array, W: number, H: number,
  cx: number, cy: number,
  a: number, b: number,
  theta: number,
) {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const r = Math.max(a, b) + 1;
  const xMin = Math.max(0, Math.floor(cx - r));
  const xMax = Math.min(W - 1, Math.ceil(cx + r));
  const yMin = Math.max(0, Math.floor(cy - r));
  const yMax = Math.min(H - 1, Math.ceil(cy + r));
  const a2 = a * a, b2 = b * b;
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const lx = dx * ct + dy * st;
      const ly = -dx * st + dy * ct;
      if ((lx * lx) / a2 + (ly * ly) / b2 <= 1) g[y * W + x] = 1;
    }
  }
}

/** Rotate (px, py) around pivot (cx, cy) by `theta` radians. */
function rotateAround(px: number, py: number, cx: number, cy: number, theta: number): [number, number] {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const dx = px - cx;
  const dy = py - cy;
  return [cx + dx * ct - dy * st, cy + dx * st + dy * ct];
}

/**
 * Two-lobe bean tail. Each lobe is a rotated ellipse — soft, rounded at
 * both ends. The whole tail rotates around the body attachment point so
 * the BASE stays put and the TIPS sweep up/down together (real-fish swim
 * physics, not counter-flapping fan). Interior is sparse stipple but the
 * silhouette stays fully solid so the bean shape reads cleanly.
 */
const TAIL_REST_TILT = 0.30;   // base splay angle of each lobe (radians)
const TAIL_SWING_AMP = 0.24;   // peak swing radians around the base

function buildTailFrame(W: number, H: number, geom: BodyGeom, phase: number): Uint8Array {
  const grid = new Uint8Array(W * H);
  const { bcx, bcy, brx, bry } = geom;

  const baseX = bcx - brx * 0.92;
  const tipX = 1;
  const tailLength = baseX - tipX;

  const aLen = tailLength * 0.52;     // major axis (lobe length)
  const bWid = bry * 0.45;            // minor axis (lobe thickness)

  const swing = TAIL_SWING_AMP * Math.sin(phase);

  // Lobes sit above and below the body attach point; rotation around the
  // attachment carries both the lobe centres and orientation through the swing.
  const restUpC: [number, number] = [baseX - tailLength * 0.45, bcy - bry * 0.40];
  const restDnC: [number, number] = [baseX - tailLength * 0.45, bcy + bry * 0.40];

  const [upCX, upCY] = rotateAround(restUpC[0], restUpC[1], baseX, bcy, swing);
  const [dnCX, dnCY] = rotateAround(restDnC[0], restDnC[1], baseX, bcy, swing);

  const upAngle = Math.PI + TAIL_REST_TILT + swing;
  const dnAngle = Math.PI - TAIL_REST_TILT + swing;

  fillRotatedEllipse(grid, W, H, upCX, upCY, aLen, bWid, upAngle);
  fillRotatedEllipse(grid, W, H, dnCX, dnCY, aLen, bWid, dnAngle);

  // Interior stipple — preserve the silhouette by skipping any dot that
  // borders an empty cell (so contour cells always survive).
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!grid[y * W + x]) continue;
      const onEdge =
        (x === 0 || !grid[y * W + (x - 1)]) ||
        (x === W - 1 || !grid[y * W + (x + 1)]) ||
        (y === 0 || !grid[(y - 1) * W + x]) ||
        (y === H - 1 || !grid[(y + 1) * W + x]);
      if (onEdge) continue;
      if (BAYER_4[y & 3][x & 3] > 0.78) grid[y * W + x] = 0;
    }
  }

  return grid;
}

// ── Pectoral fin ──────────────────────────────────────────────────────

/**
 * Small side fin behind the head, paddling. Phase 0 = extended, π = tucked.
 */
function buildPectoralFrame(W: number, H: number, geom: BodyGeom, phase: number): Uint8Array {
  const grid = new Uint8Array(W * H);
  const { pectoralBaseX, pectoralBaseY, brx } = geom;

  const open = (1 + Math.cos(phase)) / 2; // 1 = fully extended, 0 = tucked
  const length = 1.5 + open * 2.5;
  const angleRad = Math.PI * 0.32; // down-and-back from base
  const tipX = pectoralBaseX - Math.cos(angleRad) * length;
  const tipY = pectoralBaseY + Math.sin(angleRad) * length * 1.3;

  // Wedge: base spans 2 dots vertically, tip is single point.
  fillTri(
    grid, W, H,
    pectoralBaseX,         pectoralBaseY - 0.3,
    pectoralBaseX + 1.2,   pectoralBaseY + 0.6,
    tipX,                  tipY,
  );

  // Fin is translucent — sparse stipple.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!grid[y * W + x]) continue;
      if (BAYER_4[y & 3][x & 3] > 0.55) grid[y * W + x] = 0;
    }
  }
  // Keep the tip lit so the silhouette reads.
  setDot(grid, W, H, tipX, tipY);
  setDot(grid, W, H, pectoralBaseX, pectoralBaseY);

  return grid;
}

// ── Mouth atlas ───────────────────────────────────────────────────────

const MOUTH_W = 3;
const MOUTH_H = 3;

const MOUTH_PATTERNS: Record<MouthShape, ReadonlyArray<readonly number[]>> = {
  // 1 = lit dot drawn over the body. Patterns read top-to-bottom, left-to-right.
  neutral: [
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 0],
  ],
  o: [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],
  smile: [
    [0, 0, 0],
    [1, 0, 1],
    [0, 1, 0],
  ],
  frown: [
    [0, 1, 0],
    [1, 0, 1],
    [0, 0, 0],
  ],
  x: [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ],
  yawn: [
    [0, 1, 0],
    [1, 1, 1],
    [1, 1, 1],
  ],
};

function patternToBitmap(pattern: ReadonlyArray<readonly number[]>): Uint8Array {
  const out = new Uint8Array(MOUTH_W * MOUTH_H);
  for (let y = 0; y < MOUTH_H; y++) {
    for (let x = 0; x < MOUTH_W; x++) {
      out[y * MOUTH_W + x] = pattern[y]?.[x] ?? 0;
    }
  }
  return out;
}

// ── Public builder ────────────────────────────────────────────────────

const TAIL_FRAME_COUNT = 12;
const PECTORAL_FRAME_COUNT = 4;

export function buildMardiSprite(dotCols: number, dotRows: number): MardiSprite {
  const { bowl, centerX, bodyCY, bodyR } = buildBowl(dotCols, dotRows);

  // Chibi proportions: shorter and rounder than before.
  const fishW = Math.round(bodyR * 1.18);
  const fishH = Math.round(bodyR * 0.66);

  const { mask, base, geom } = buildBodyLayers(fishW, fishH);

  const tailFrames: Uint8Array[] = [];
  for (let i = 0; i < TAIL_FRAME_COUNT; i++) {
    const phase = (i / TAIL_FRAME_COUNT) * Math.PI * 2;
    tailFrames.push(buildTailFrame(fishW, fishH, geom, phase));
  }

  const pectoralFrames: Uint8Array[] = [];
  for (let i = 0; i < PECTORAL_FRAME_COUNT; i++) {
    const phase = (i / PECTORAL_FRAME_COUNT) * Math.PI * 2;
    pectoralFrames.push(buildPectoralFrame(fishW, fishH, geom, phase));
  }

  const fishX = Math.round(centerX - fishW / 2 - 1);
  const fishY = Math.round(bodyCY - fishH / 2 + 1);

  const eyeX = Math.round(geom.eyeCX);
  const eyeY = Math.round(geom.eyeCY);

  const mouthShapes: Record<MouthShape, Uint8Array> = {
    neutral: patternToBitmap(MOUTH_PATTERNS.neutral),
    o:       patternToBitmap(MOUTH_PATTERNS.o),
    smile:   patternToBitmap(MOUTH_PATTERNS.smile),
    frown:   patternToBitmap(MOUTH_PATTERNS.frown),
    x:       patternToBitmap(MOUTH_PATTERNS.x),
    yawn:    patternToBitmap(MOUTH_PATTERNS.yawn),
  };

  const pupilOffset: Record<PupilDir, [number, number]> = {
    center:  [0, 0],
    left:   [-2, 0],
    right:  [2, 0],
    up:     [0, -1],
    down:   [0, 1],
    upLeft: [-2, -1],
    upRight:[2, -1],
  };

  return {
    bowl,
    bodyMask: mask,
    bodyBase: base,
    tailFrames,
    pectoralFrames,
    fishW,
    fishH,
    fishX,
    fishY,
    eyeX,
    eyeY,
    pupilOffset,
    mouthX: geom.mouthX,
    mouthY: geom.mouthY,
    mouthShapes,
    mouthShapeW: MOUTH_W,
    mouthShapeH: MOUTH_H,
    blushX: geom.blushX,
    blushY: geom.blushY,
    mouthBubbleX: fishX + Math.round(geom.mouthX) + 1,
    mouthBubbleY: fishY + Math.round(geom.mouthY) + 1,
  };
}
