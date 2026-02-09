/**
 * Parse markdown summary content into sections.
 * Supports formats:
 * - # BookName followed by ## Section Label (verse range or descriptive)
 * - ## Section Label\n\nParagraph...
 * - Plain prose (single "Overview" section)
 */

export interface SummarySection {
  label: string;
  body: string;
}

export function parseSummaryMarkdown(
  markdown: string,
  bookName: string
): { title: string; sections: SummarySection[] } {
  const trimmed = markdown.trim();
  if (!trimmed) return { title: bookName, sections: [] };

  // Remove leading # BookName line if present
  let content = trimmed.replace(/^#\s+.+\n?/, "").trim();

  const sections: SummarySection[] = [];
  const parts = content.split(/\n(?=##\s+)/);

  for (const part of parts) {
    const sectionMatch = part.match(/^##\s+(.+?)\n+([\s\S]*)$/);
    if (sectionMatch) {
      const label = sectionMatch[1].trim();
      const body = sectionMatch[2].trim();
      if (body) sections.push({ label, body });
    }
  }

  // If no ## sections, treat entire content as one section
  if (sections.length === 0 && content) {
    sections.push({ label: "Overview", body: content });
  }

  return { title: bookName, sections };
}
