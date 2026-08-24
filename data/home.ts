import fs from "node:fs";
import path from "node:path";

export type HomeStatusItem = {
  label: string;
  value: string;
  url?: string;
};

export type HomeExternalLink = {
  title: string;
  url: string;
  note: string;
};

export type HomeContent = {
  rightNowLabel: string;
  updated: string;
  headline: string;
  statusItems: HomeStatusItem[];
  linksLabel: string;
  linksHeading: string;
  linksIntro: string;
  linksEmpty: string;
  externalLinks: HomeExternalLink[];
};

const homeContentPath = path.join(process.cwd(), "content", "home.md");

function parseDocument(source: string): {
  metadata: Record<string, string>;
  content: string;
} {
  if (!source.startsWith("---\n")) {
    return { metadata: {}, content: source.trim() };
  }

  const endIndex = source.indexOf("\n---\n", 4);

  if (endIndex === -1) {
    return { metadata: {}, content: source.trim() };
  }

  const metadata = source
    .slice(4, endIndex)
    .split("\n")
    .reduce<Record<string, string>>((values, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return values;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^(?:"|')|(?:"|')$/g, "");

      if (key) {
        values[key] = value;
      }

      return values;
    }, {});

  return {
    metadata,
    content: source.slice(endIndex + 5).trim(),
  };
}

function getSection(content: string, headings: string | string[]): string {
  const escapedHeadings = (Array.isArray(headings) ? headings : [headings])
    .map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const match = content.match(
    new RegExp(`(?:^|\\n)##\\s+(?:${escapedHeadings})\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i"),
  );

  return match?.[1].trim() ?? "";
}

function parseStatusItems(section: string): HomeStatusItem[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .flatMap((line) => {
      const item = line.slice(2);
      const separator = item.match(/\s+(?:—|--|-)\s+/);

      if (!separator || separator.index === undefined) {
        return [];
      }

      const label = item.slice(0, separator.index).trim();
      const value = item.slice(separator.index + separator[0].length).trim();

      return label && value
        ? [{
            label,
            value,
            ...(isExternalUrl(value) ? { url: value } : {}),
          }]
        : [];
    });
}

function isExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseExternalLinks(section: string): HomeExternalLink[] {
  return section
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ["))
    .flatMap((line) => {
      const match = line.match(
        /^- \[([^\]]+)]\(([^)]+)\)(?:\s+(?:—|--|-)\s+(.+))?$/,
      );

      if (!match || !isExternalUrl(match[2])) {
        return [];
      }

      return [{
        title: match[1].trim(),
        url: match[2].trim(),
        note: match[3]?.trim() ?? "",
      }];
    });
}

export function parseHomeContent(source: string): HomeContent {
  const { metadata, content } = parseDocument(source);

  return {
    rightNowLabel: metadata.right_now_label ?? "Right now",
    updated: metadata.updated ?? "",
    headline: metadata.headline ?? "",
    statusItems: parseStatusItems(getSection(content, "Current")),
    linksLabel: metadata.links_label ?? "Elsewhere",
    linksHeading: metadata.links_heading ?? "Worth a detour.",
    linksIntro: metadata.links_intro ?? "",
    linksEmpty: metadata.links_empty ?? "Nothing pinned right now.",
    externalLinks: parseExternalLinks(
      getSection(content, ["Elsewhere", "Elsewhere On The Internet"]),
    ),
  };
}

export function getHomeContent(): HomeContent {
  return parseHomeContent(fs.readFileSync(homeContentPath, "utf8"));
}
