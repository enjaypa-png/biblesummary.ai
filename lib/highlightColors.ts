import booksData from "@/data/books.json";

export const HIGHLIGHT_COLORS: Record<
  string,
  { label: string; swatch: string; bg: string; bgDark: string }
> = {
  yellow: {
    label: "Yellow",
    swatch: "#FFF44F",
    bg: "rgba(255, 244, 79, 0.35)",
    bgDark: "rgba(255, 244, 79, 0.20)",
  },
  orange: {
    label: "Orange",
    swatch: "#FF9F43",
    bg: "rgba(255, 159, 67, 0.30)",
    bgDark: "rgba(255, 159, 67, 0.20)",
  },
  green: {
    label: "Green",
    swatch: "#7BED9F",
    bg: "rgba(123, 237, 159, 0.35)",
    bgDark: "rgba(123, 237, 159, 0.20)",
  },
  pink: {
    label: "Pink",
    swatch: "#FF6B81",
    bg: "rgba(255, 107, 129, 0.30)",
    bgDark: "rgba(255, 107, 129, 0.20)",
  },
  blue: {
    label: "Blue",
    swatch: "#70A1FF",
    bg: "rgba(112, 161, 255, 0.30)",
    bgDark: "rgba(112, 161, 255, 0.20)",
  },
};

export function getHighlightBg(color: string, themeMode: string): string {
  const c = HIGHLIGHT_COLORS[color];
  if (!c) return "transparent";
  return themeMode === "dark" ? c.bgDark : c.bg;
}

export function getBookIndex(slug: string): number {
  const book = booksData.find((b) => b.slug === slug);
  return book?.order_index || 0;
}
