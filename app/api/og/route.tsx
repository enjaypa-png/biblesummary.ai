import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const logoData = await readFile(
    join(process.cwd(), "public", "brand", "logo-512.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8f7ff 0%, #ede9fe 50%, #f0ecff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Actual logo image */}
        <img
          src={logoBase64}
          width={220}
          height={220}
          style={{
            marginRight: 60,
          }}
        />

        {/* Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#1e1b4b",
                letterSpacing: "-1px",
              }}
            >
              ClearBible
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#7c5cfc",
                letterSpacing: "-1px",
              }}
            >
              .ai
            </span>
          </div>
          <span
            style={{
              fontSize: 30,
              color: "#6b7280",
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            AI Verse Explanations & Chapter Summaries
          </span>
          <span
            style={{
              fontSize: 30,
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            AI Bible Ask/Search Feature
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
