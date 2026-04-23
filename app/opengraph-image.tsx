import { ImageResponse } from "next/og";
import { FISH_ART } from "./_og/fish-art";

export const runtime = "edge";
export const alt = "MARDI — a second brain that lives in the corner of your screen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social-share card. Two columns:
 *   left  — agent header, headline, tagline, quote
 *   right — Mardi rendered as baked-in braille art (see scripts/gen-fish-art.mjs)
 *
 * Everything is static text at request time — Satori can't run Canvas, so the
 * fish is pre-sampled at build time into /app/_og/fish-art.ts and rendered
 * here as plain monospace braille glyphs.
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#08070b",
          color: "#f3f1ec",
          display: "flex",
          padding: "64px 72px",
          fontFamily: "ui-monospace, Menlo, monospace",
          position: "relative",
          letterSpacing: "0.01em",
        }}
      >
        {/* ── Braille wallpaper ──────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.22,
            color: "#3a3832",
            fontSize: 16,
            lineHeight: "20px",
            whiteSpace: "pre",
            flexWrap: "wrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 36 })
            .map(() =>
              Array.from({ length: 90 })
                .map((_, i) => (i % 11 === 0 ? "⠿" : i % 7 === 0 ? "⠒" : " "))
                .join("")
            )
            .join("\n")}
        </div>

        {/* ── Left column: copy ─────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            zIndex: 1,
            paddingRight: 24,
          }}
        >
          {/* Agent header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#b7b3aa",
            }}
          >
            <span style={{ color: "#ff2ecc", fontSize: 22 }}>⣿⣿</span>
            <span style={{ color: "#f3f1ec" }}>[MARDI]</span>
            <span style={{ color: "#ff2ecc", fontSize: 22 }}>⣿⣿</span>
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6b6860",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              marginTop: 10,
            }}
          >
            v0.1 · greenfield · macOS
          </div>

          {/* Braille rule */}
          <div
            style={{
              fontSize: 14,
              color: "#6b6860",
              marginTop: 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxWidth: 560,
            }}
          >
            {"⠒".repeat(160)}
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 40,
              fontSize: 58,
              lineHeight: "66px",
              letterSpacing: "-0.01em",
            }}
          >
            <span>a second brain</span>
            <span>that lives in the</span>
            <span>
              <span style={{ color: "#ff2ecc" }}>corner</span> of your screen.
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 18,
              color: "#b7b3aa",
            }}
          >
            <span
              style={{
                color: "#6b6860",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              ⠿ project-mardi.com
            </span>
            <span style={{ fontStyle: "italic", color: "#f3f1ec" }}>
              “Hi. I’m Mardi. I’ll remember things for you.”
            </span>
          </div>
        </div>

        {/* ── Right column: the fish ────────────────────── */}
        <div
          style={{
            width: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            position: "relative",
          }}
        >
          {/* Soft pink glow behind the fish */}
          <div
            style={{
              position: "absolute",
              top: "22%",
              bottom: "22%",
              left: "6%",
              right: "6%",
              background:
                "radial-gradient(closest-side, rgba(255,46,204,0.32) 0%, rgba(255,46,204,0.08) 45%, transparent 80%)",
              display: "flex",
            }}
          />

          {/* Chrome: top row */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: "#6b6860", display: "flex" }}>
              ⣿⣿ fishbowl
            </span>
            <span style={{ color: "#ff2ecc", display: "flex" }}>
              · summoned
            </span>
          </div>

          {/* The fish art */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 16,
              lineHeight: "16px",
              color: "#ff2ecc",
              whiteSpace: "pre",
              textAlign: "center",
              letterSpacing: "0",
            }}
          >
            {FISH_ART.map((line, i) => (
              <span
                key={i}
                style={{
                  display: "flex",
                  whiteSpace: "pre",
                  letterSpacing: "0",
                }}
              >
                {line}
              </span>
            ))}
          </div>

          {/* Chrome: bottom row */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#b7b3aa",
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ display: "flex" }}>› save something?</span>
            <span style={{ color: "#ff2ecc", letterSpacing: "0.28em", display: "flex" }}>
              ⣿⣿⣿⣿⣿⣿⣿⣿
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
