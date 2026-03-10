import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 240,
            borderRadius: 28,
            background: "linear-gradient(160deg, #a78bfa 0%, #7c5cfc 50%, #6d4de0 100%)",
            marginRight: 60,
            boxShadow: "0 8px 30px rgba(124, 92, 252, 0.3)",
            position: "relative",
          }}
        >
          {/* Cross */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 24,
                height: 100,
                background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
                borderRadius: 12,
                position: "absolute",
                top: 40,
              }}
            />
            <div
              style={{
                width: 70,
                height: 24,
                background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                borderRadius: 12,
                position: "absolute",
                top: 70,
              }}
            />
          </div>
          {/* Book pages */}
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              height: 20,
              background: "#e5e7eb",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>

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
