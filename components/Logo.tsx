/**
 * Logo component — single source of truth for the ClearBible.ai logo.
 *
 * Renders the uploaded SVG logo from /public/clearbible-logo.svg.
 * The SVG uses embedded raster image data (no <text> elements),
 * so an <img> tag renders it correctly.
 *
 * To update the logo, replace public/clearbible-logo.svg.
 * All instances across the app will update automatically.
 */

/* eslint-disable @next/next/no-img-element */

interface LogoProps {
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function Logo({ height = 200, style, className }: LogoProps) {
  return (
    <img
      src="/clearbible-logo.svg"
      alt="ClearBible.ai Logo"
      style={{ height, width: "auto", ...style }}
      className={className}
    />
  );
}
