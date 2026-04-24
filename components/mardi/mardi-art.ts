/**
 * Mardi — procedural anatomy & renderer.
 *
 * Pure TS. No DOM, no React. Designed to be dropped into any app that can
 * rasterise a Uint8Array dot grid to braille (web canvas, native, terminal,
 * menubar icon, etc.). Nothing in here knows about the browser.
 *
 * Coordinate system: dots. A braille cell is 2 dots wide × 4 dots tall, so a
 * 96 × 96 dot grid == 48 × 24 braille cells. The reference pose targets a
 * 96 × 96 grid; smaller or larger grids scale uniformly.
 */

export type DotGrid = {
  cols: number; // dot columns
  rows: number; // dot rows
  data: Uint8Array; // row-major, 1 = on, 0 = off
};

export function newGrid(cols: number, rows: number): DotGrid {
  return { cols, rows, data: new Uint8Array(cols * rows) };
}

export function clearGrid(g: DotGrid) {
  g.data.fill(0);
}

// ── Drawing primitives ─────────────────────────────────────────────────

function setDot(g: DotGrid, x: number, y: number, on = true) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= g.cols || iy < 0 || iy >= g.rows) return;
  g.data[iy * g.cols + ix] = on ? 1 : 0;
}

export function fillEllipse(
  g: DotGrid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  if (rx <= 0 || ry <= 0) return;
  const x0 = Math.max(0, Math.floor(cx - rx));
  const x1 = Math.min(g.cols - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const y1 = Math.min(g.rows - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) g.data[y * g.cols + x] = 1;
    }
  }
}

export function strokeEllipse(
  g: DotGrid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const steps = Math.max(24, Math.floor(2 * Math.PI * Math.max(rx, ry) * 1.2));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    setDot(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
}

export function clearEllipse(
  g: DotGrid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  if (rx <= 0 || ry <= 0) return;
  const x0 = Math.max(0, Math.floor(cx - rx));
  const x1 = Math.min(g.cols - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const y1 = Math.min(g.rows - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) g.data[y * g.cols + x] = 0;
    }
  }
}

export function fillTriangle(
  g: DotGrid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
  const maxX = Math.min(g.cols - 1, Math.ceil(Math.max(ax, bx, cx)));
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
  const maxY = Math.min(g.rows - 1, Math.ceil(Math.max(ay, by, cy)));
  const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  if (Math.abs(area) < 1e-6) return;
  const s = area > 0 ? 1 : -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) * s;
      const w1 = ((cx - bx) * (y - by) - (cy - by) * (x - bx)) * s;
      const w2 = ((ax - cx) * (y - cy) - (ay - cy) * (x - cx)) * s;
      if (w0 >= 0 && w1 >= 0 && w2 >= 0) g.data[y * g.cols + x] = 1;
    }
  }
}

export function drawLine(
  g: DotGrid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  let a = Math.round(x0);
  let b = Math.round(y0);
  const x = Math.round(x1);
  const y = Math.round(y1);
  const dx = Math.abs(x - a);
  const sx = a < x ? 1 : -1;
  const dy = -Math.abs(y - b);
  const sy = b < y ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setDot(g, a, b);
    if (a === x && b === y) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      a += sx;
    }
    if (e2 <= dx) {
      err += dx;
      b += sy;
    }
  }
}

// ── Mardi anatomy ──────────────────────────────────────────────────────

export type MardiMood =
  | "idle"
  | "summoned"
  | "thinking"
  | "success"
  | "error"
  | "sleeping";

export type MardiPose = {
  /** Time in seconds, free-running. Used for internal phases. */
  t: number;
  /** Body center in dot coords. */
  cx: number;
  cy: number;
  /** Vertical bob offset. */
  bob: number;
  /** Horizontal jitter (error shake). */
  jitter: number;
  /** -1..1. Drives tail fan sweep. */
  tailPhase: number;
  /** -1..1. Drives fin flutter. */
  finPhase: number;
  /** 0..1. Mouth opening. */
  mouthOpen: number;
  /** 0..1. Eye openness. 0 = closed (blink or sleep). */
  eyeOpen: number;
  /** Uniform scale relative to a 96×96 reference grid. */
  scale: number;
};

/**
 * Paint Mardi into the given dot grid. Does not clear first — caller clears.
 * The pose fully controls motion; this function is deterministic.
 */
export function drawMardi(g: DotGrid, p: MardiPose) {
  const s = p.scale;
  const x = p.cx + p.jitter;
  const y = p.cy + p.bob;

  // ── Tail (left) ────────────────────────────────────────────────────
  // Two triangular fans rooted at the body, tips flaring far left and
  // flapping in antiphase so the tail "swims". Tall enough to read as a
  // goldfish tail, not a minnow.
  const tailRootX = x - 24 * s;
  const tailTipX  = x - 42 * s;
  const tailSpread = 14 * s;
  const tailFlap = p.tailPhase * 5 * s;
  fillTriangle(
    g,
    tailRootX, y - 3 * s,
    tailRootX, y + 3 * s,
    tailTipX,  y - tailSpread + tailFlap,
  );
  fillTriangle(
    g,
    tailRootX, y - 3 * s,
    tailRootX, y + 3 * s,
    tailTipX,  y + tailSpread + tailFlap,
  );
  // Tail peduncle — a thin stub where tail meets body
  fillEllipse(g, tailRootX - 3 * s, y, 4 * s, 2.5 * s);

  // ── Body ───────────────────────────────────────────────────────────
  // Core oval + belly lobe + head lobe — overlapping so the silhouette
  // has the classic goldfish pear shape rather than a flat ellipse.
  fillEllipse(g, x,              y,         26 * s, 12 * s); // core
  fillEllipse(g, x + 4 * s,      y + 2 * s, 22 * s, 9 * s);  // belly
  fillEllipse(g, x + 16 * s,     y - 1 * s, 12 * s, 9 * s);  // head

  // ── Dorsal fin (top, back half) ────────────────────────────────────
  const dorsalTipY = y - 11 * s - 6 * s + p.finPhase * 1.6 * s;
  fillTriangle(
    g,
    x - 10 * s,  y - 11 * s,
    x + 4 * s,   y - 11 * s,
    x - 3 * s,   dorsalTipY,
  );
  // Second, smaller dorsal spike near the head
  fillTriangle(
    g,
    x + 4 * s,   y - 10 * s,
    x + 12 * s,  y - 10 * s,
    x + 8 * s,   y - 15 * s + p.finPhase * 1.1 * s,
  );

  // ── Anal + pelvic fins (bottom) ────────────────────────────────────
  const ventralTipY = y + 11 * s + 6 * s - p.finPhase * 1.6 * s;
  fillTriangle(
    g,
    x - 8 * s,   y + 11 * s,
    x + 4 * s,   y + 11 * s,
    x - 2 * s,   ventralTipY,
  );
  fillTriangle(
    g,
    x + 5 * s,   y + 10 * s,
    x + 13 * s,  y + 10 * s,
    x + 8 * s,   y + 15 * s - p.finPhase * 1.1 * s,
  );

  // ── Pectoral fin (side, subtle) ────────────────────────────────────
  fillTriangle(
    g,
    x + 6 * s,   y + 3 * s,
    x + 14 * s,  y + 5 * s + p.finPhase * 1.3 * s,
    x + 6 * s,   y + 8 * s,
  );

  // ── Gill arch (cheek curve) ────────────────────────────────────────
  for (let dy = -4; dy <= 4; dy++) {
    setDot(g, x + 11 * s + Math.abs(dy) * 0.35 * s, y + dy * s, false);
  }

  // ── Highlight spot (top of body) ──────────────────────────────────
  // Tiny cleared patch that reads as a light catch on the dorsal curve.
  // Gives the otherwise-solid body some shape.
  clearEllipse(g, x - 4 * s, y - 6 * s, 2 * s, 1.4 * s);

  // ── Lateral line — 2 small dashes along the body flank ────────────
  clearEllipse(g, x - 6 * s,  y + 1 * s, 1.4 * s, 0.8 * s);
  clearEllipse(g, x + 2 * s,  y + 1 * s, 1.4 * s, 0.8 * s);

  // ── Eye ────────────────────────────────────────────────────────────
  const eyeX = x + 19 * s;
  const eyeY = y - 3 * s;
  clearEllipse(g, eyeX, eyeY, 2.6 * s, 2.6 * s);
  if (p.eyeOpen < 0.2) {
    // closed — a sleepy line
    drawLine(g, eyeX - 2.2 * s, eyeY, eyeX + 2.2 * s, eyeY);
  } else {
    strokeEllipse(g, eyeX, eyeY, 2.2 * s, 2.2 * s);
    const pupilR = 1.1 * s * p.eyeOpen;
    fillEllipse(g, eyeX + 0.5 * s, eyeY, pupilR, pupilR);
  }

  // ── Mouth ──────────────────────────────────────────────────────────
  const mouthX = x + 27 * s;
  const mouthY = y + 2 * s;
  if (p.mouthOpen > 0.25) {
    const mr = 1.6 * s * p.mouthOpen + 0.7 * s;
    clearEllipse(g, mouthX, mouthY, mr, mr * 0.9);
    strokeEllipse(g, mouthX, mouthY, mr, mr * 0.9);
  } else {
    setDot(g, mouthX,         mouthY);
    setDot(g, mouthX - 1 * s, mouthY);
  }
}

// ── Pose helpers for each mood ─────────────────────────────────────────

type PoseInput = {
  t: number;
  mood: MardiMood;
  dotCols: number;
  dotRows: number;
  /** External blink trigger — 1 = fully open, 0 = closed. */
  blink: number;
  /** If true, emit a no-motion pose (prefers-reduced-motion). */
  still: boolean;
};

/**
 * Compute a pose for the current moment. The fish's body/face stays put;
 * mood biases the motion character (speed, amplitude, posture).
 */
export function poseFor({
  t,
  mood,
  dotCols,
  dotRows,
  blink,
  still,
}: PoseInput): MardiPose {
  const scale = Math.min(dotCols, dotRows) / 96;

  // Anchor offset — the fish silhouette is asymmetric (tail extends 42 dots
  // left, mouth only 28 right), so we bias the body rightward to keep the
  // whole creature visually centred in the grid.
  const cx = dotCols * 0.57;
  let cy = dotRows * 0.5;

  if (still) {
    return {
      t, cx, cy, bob: 0, jitter: 0,
      tailPhase: 0, finPhase: 0,
      mouthOpen: 0,
      eyeOpen: mood === "sleeping" ? 0 : 1,
      scale,
    };
  }

  // Mood-specific motion
  let bobAmp = 2.2;
  let bobFreq = 1.2;
  let tailFreq = 2.8;
  let finFreq = 3.2;
  let jitter = 0;
  let mouthOpen = 0;
  let postureDy = 0;

  switch (mood) {
    case "idle":
      // default
      break;
    case "summoned":
      bobAmp = 1.6; bobFreq = 1.8;
      tailFreq = 4.2;
      finFreq = 4.4;
      // a little perky — nose up
      postureDy = -1.2 * scale;
      mouthOpen = 0.45 + 0.55 * Math.sin(t * 5.5);
      break;
    case "thinking":
      bobAmp = 1.1; bobFreq = 0.7;
      tailFreq = 1.4;
      finFreq = 1.6;
      break;
    case "success":
      bobAmp = 2.8; bobFreq = 2.0;
      tailFreq = 3.8;
      finFreq = 4.0;
      postureDy = -0.8 * scale;
      break;
    case "error":
      bobAmp = 0.8; bobFreq = 6.0;
      tailFreq = 1.8;
      finFreq = 2.0;
      jitter = Math.round(Math.sin(t * 38) * 1.4 * scale);
      break;
    case "sleeping":
      bobAmp = 0.8; bobFreq = 0.4;
      tailFreq = 0.6;
      finFreq = 0.5;
      postureDy = 1.5 * scale;
      break;
  }

  cy += postureDy;

  return {
    t,
    cx,
    cy,
    bob: Math.sin(t * bobFreq) * bobAmp * scale,
    jitter,
    tailPhase: Math.sin(t * tailFreq),
    finPhase: Math.sin(t * finFreq + 0.4),
    mouthOpen,
    eyeOpen: mood === "sleeping" ? 0 : blink,
    scale,
  };
}

// ── Braille packing ────────────────────────────────────────────────────

/**
 * For each braille cell, bit positions of its 8 dots within U+2800.
 * (dot-col offset, dot-row offset, bit).
 */
export const BRAILLE_LAYOUT: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0x01], [1, 0, 0x08],
  [0, 1, 0x02], [1, 1, 0x10],
  [0, 2, 0x04], [1, 2, 0x20],
  [0, 3, 0x40], [1, 3, 0x80],
];

/**
 * Pack a dot grid into a `rows` x `cols` array of braille codepoints. The
 * grid must be exactly `cols*2` x `rows*4` dots. Optional `shearRow` / `shearX`
 * produce a single-row horizontal glitch on the given dot row.
 */
export function packBraille(
  g: DotGrid,
  cols: number,
  rows: number,
  shearRow = -1,
  shearX = 0,
): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const line: number[] = [];
    for (let c = 0; c < cols; c++) {
      let cp = 0x2800;
      for (const [dc, dr, bit] of BRAILLE_LAYOUT) {
        const sy = r * 4 + dr;
        let sx = c * 2 + dc;
        if (sy === shearRow) sx += shearX;
        if (sx >= 0 && sx < g.cols && sy >= 0 && sy < g.rows) {
          if (g.data[sy * g.cols + sx]) cp |= bit;
        }
      }
      line.push(cp);
    }
    out.push(line);
  }
  return out;
}

// ── Palette ────────────────────────────────────────────────────────────

export const MOOD_COLOR: Record<MardiMood, string> = {
  idle:     "#f3f1ec", // bone
  summoned: "#ff2ecc", // pink — THE accent
  thinking: "#ffb63d", // gold
  success:  "#3ef0ff", // cyan
  error:    "#ff3355", // red
  sleeping: "#6b6860", // bone-3
};
