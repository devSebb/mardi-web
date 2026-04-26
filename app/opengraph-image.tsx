import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MARDI — a second brain that lives in the corner of your screen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
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

        {/* ── Copy ─────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            zIndex: 1,
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

      </div>
    ),
    { ...size }
  );
}
