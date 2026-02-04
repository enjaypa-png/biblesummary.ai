"use client";

interface ExplanationCardProps {
  explanation: string;
  onClose: () => void;
}

export default function ExplanationCard({
  explanation,
  onClose,
}: ExplanationCardProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--card)",
        border: "0.5px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4
          className="text-[14px] font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Explanation
        </h4>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full active:opacity-70 transition-opacity -mt-1 -mr-1"
          style={{ color: "var(--secondary)" }}
          aria-label="Close explanation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p
        className="text-[14px] leading-relaxed"
        style={{ color: "var(--secondary)" }}
      >
        {explanation}
      </p>
    </div>
  );
}
