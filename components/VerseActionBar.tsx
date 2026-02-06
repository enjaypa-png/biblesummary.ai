"use client";

interface VerseActionBarProps {
  onExplain: () => void;
  onNote: () => void;
  onShare: () => void;
}

interface ActionItem {
  key: string;
  label: string;
  icon: JSX.Element;
  onClick?: () => void;
  disabled?: boolean;
}

export default function VerseActionBar({ onExplain, onNote, onShare }: VerseActionBarProps) {

  const svg = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const actions: ActionItem[] = [
    {
      key: "explain",
      label: "Explain",
      icon: (
        <svg {...svg}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      onClick: onExplain,
    },
    {
      key: "note",
      label: "Note",
      icon: (
        <svg {...svg}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: onNote,
    },
    {
      key: "share",
      label: "Share",
      icon: (
        <svg {...svg}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
      onClick: onShare,
    },
    {
      key: "highlight",
      label: "Highlight",
      icon: (
        <svg {...svg}>
          <path d="m9 11-6 6v3h9l3-3" />
          <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
      ),
      disabled: true,
    },
    {
      key: "bookmark",
      label: "Bookmark",
      icon: (
        <svg {...svg}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
      disabled: true,
    },
    {
      key: "summary",
      label: "Summary",
      icon: (
        <svg {...svg}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      disabled: true,
    },
  ];

  return (
    <span className="block my-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      <span
        className="flex items-stretch overflow-hidden"
        style={{
          backgroundColor: "var(--accent)",
          borderRadius: "9999px",
        }}
      >
        {actions.map((action, i) => (
          <button
            key={action.key}
            onClick={action.disabled ? undefined : action.onClick}
            disabled={action.disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${
              !action.disabled ? "active:bg-white/[0.15]" : ""
            }`}
            style={{
              color: "#ffffff",
              opacity: action.disabled ? 0.4 : 1,
              cursor: action.disabled ? "default" : "pointer",
              borderRight:
                i < actions.length - 1
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "none",
            }}
          >
            {action.icon}
            <span className="text-[10px] font-medium leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </span>
    </span>
  );
}
