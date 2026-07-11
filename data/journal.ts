import fs from "node:fs";
import path from "node:path";

export type JournalEntry = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  html: string;
};

const journalDirectory = path.join(process.cwd(), "content", "journal");

function toSlug(fileName: string): string {
  return fileName.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function parseFrontmatter(source: string): {
  metadata: Record<string, string>;
  content: string;
} {
  if (!source.startsWith("---\n")) {
    return {
      metadata: {},
      content: source.trim(),
    };
  }

  const endIndex = source.indexOf("\n---\n", 4);

  if (endIndex === -1) {
    return {
      metadata: {},
      content: source.trim(),
    };
  }

  const frontmatter = source.slice(4, endIndex);
  const content = source.slice(endIndex + 5).trim();
  const metadata = frontmatter.split("\n").reduce<Record<string, string>>(
    (accumulator, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");

      if (key) {
        accumulator[key] = value;
      }

      return accumulator;
    },
    {},
  );

  return { metadata, content };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline underline-offset-4">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderMarkdown(markdown: string): string {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

  return blocks
    .map((block) => {
      if (block.startsWith("### ")) {
        return `<h3>${renderInlineMarkdown(block.slice(4))}</h3>`;
      }

      if (block.startsWith("## ")) {
        return `<h2>${renderInlineMarkdown(block.slice(3))}</h2>`;
      }

      if (block.startsWith("# ")) {
        return `<h1>${renderInlineMarkdown(block.slice(2))}</h1>`;
      }

      if (block.split("\n").every((line) => line.startsWith("- "))) {
        const items = block
          .split("\n")
          .map((line) => `<li>${renderInlineMarkdown(line.slice(2))}</li>`)
          .join("");

        return `<ul>${items}</ul>`;
      }

      return `<p>${block.split("\n").map(renderInlineMarkdown).join("<br />")}</p>`;
    })
    .join("\n");
}

function readJournalFile(fileName: string): JournalEntry {
  const fullPath = path.join(journalDirectory, fileName);
  const source = fs.readFileSync(fullPath, "utf8");
  const slug = toSlug(fileName);
  const { metadata, content } = parseFrontmatter(source);

  return {
    slug,
    title: metadata.title ?? slug,
    date: metadata.date ?? "",
    summary: metadata.summary ?? "",
    content,
    html: renderMarkdown(content),
  };
}

export function getJournalEntries(): JournalEntry[] {
  const files = fs
    .readdirSync(journalDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .sort((left, right) => right.localeCompare(left));

  return files.map(readJournalFile);
}

export function getJournalEntry(slug: string): JournalEntry | undefined {
  const fileName = fs
    .readdirSync(journalDirectory)
    .find((entryFileName) => toSlug(entryFileName) === slug);

  if (!fileName) {
    return undefined;
  }

  return readJournalFile(fileName);
}
