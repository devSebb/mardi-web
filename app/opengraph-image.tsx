import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MARDI — a second brain that lives in the corner of your screen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social-share card. Braille-field background, pink agent header, wordmark,
 * big tagline, subtle chrome. Rendered at request time by next/og.
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
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "ui-monospace, Menlo, monospace",
          position: "relative",
          letterSpacing: "0.01em",
        }}
      >
        {/* Braille field wallpaper */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.35,
            color: "#3a3832",
            fontSize: 18,
            lineHeight: "22px",
            whiteSpace: "pre",
            flexWrap: "wrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 36 })
            .map(() =>
              Array.from({ length: 80 })
                .map((_, i) => (i % 7 === 0 ? "⠿" : i % 5 === 0 ? "⠒" : " "))
                .join("")
            )
            .join("\n")}
        </div>

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
            zIndex: 1,
          }}
        >
          <span style={{ color: "#ff2ecc", fontSize: 22 }}>⣿⣿</span>
          <span style={{ color: "#f3f1ec" }}>[MARDI]</span>
          <span style={{ color: "#ff2ecc", fontSize: 22 }}>⣿⣿</span>
          <span style={{ color: "#6b6860", fontSize: 14, marginLeft: 14 }}>
            v0.1 · greenfield · macOS
          </span>
        </div>

        {/* Braille rule */}
        <div
          style={{
            fontSize: 16,
            color: "#6b6860",
            letterSpacing: "0",
            marginTop: 20,
            zIndex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {"⠒".repeat(220)}
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
            fontSize: 76,
            lineHeight: "84px",
            letterSpacing: "-0.01em",
            zIndex: 1,
          }}
        >
          <span>a second brain</span>
          <span>that lives in the</span>
          <span>
            <span style={{ color: "#ff2ecc" }}>corner</span> of your screen.
          </span>
        </div>

        {/* Footer row */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            color: "#b7b3aa",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#6b6860", letterSpacing: "0.28em" }}>
              ⠿ PROJECT-MARDI.COM
            </span>
            <span style={{ fontStyle: "italic", color: "#f3f1ec" }}>
              “Hi. I’m Mardi. I’ll remember things for you.”
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <span style={{ color: "#6b6860", letterSpacing: "0.28em" }}>
              SUMMON · SAVE · RECALL
            </span>
            <span style={{ color: "#ff2ecc", letterSpacing: "0.28em" }}>
              ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
