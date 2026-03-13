/**
 * Logo component — single source of truth for the ClearBible.ai logo.
 *
 * Two variants:
 * - "hero" (default): Full logo with icon, text, and subtitle lines
 * - "nav": Compact logo with icon and text only (no subtitles)
 *
 * Both are proper vector SVGs that scale perfectly at any size.
 */

/* eslint-disable @next/next/no-img-element */

interface LogoProps {
  height?: number;
  variant?: "hero" | "nav";
  style?: React.CSSProperties;
  className?: string;
}

export default function Logo({ height = 64, variant = "nav", style, className }: LogoProps) {
  const src = variant === "hero" ? "/clearbible-logo-full.svg" : "/clearbible-logo-compact.svg";
  return (
    <img
      src={src}
      alt="ClearBible.ai Logo"
      style={{ height, width: "auto", ...style }}
      className={className}
    />
  );
}
