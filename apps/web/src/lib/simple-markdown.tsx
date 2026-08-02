import type { ReactNode } from "react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

/**
 * Lightweight Markdown subset for Learn guides.
 * Supports headings, paragraphs, lists, bold, italic, inline code, and links.
 * Intentionally does not evaluate raw HTML.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i}`} className="rs-md-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const href = linkMatch[2];
        const external = href.startsWith("https://") || href.startsWith("http://");
        const internal = href.startsWith("/");
        const hash = href.startsWith("#");
        if (internal) {
          nodes.push(
            <Link
              key={`${keyPrefix}-a-${i}`}
              to={href}
              className="text-rs-accent underline-offset-2 hover:underline"
            >
              {linkMatch[1]}
            </Link>,
          );
        } else if (external || hash) {
          nodes.push(
            <a
              key={`${keyPrefix}-a-${i}`}
              href={href}
              className="text-rs-accent underline-offset-2 hover:underline"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {linkMatch[1]}
            </a>,
          );
        } else {
          nodes.push(<span key={`${keyPrefix}-a-${i}`}>{linkMatch[1]}</span>);
        }
      }
    }
    last = match.index + token.length;
    i += 1;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function SimpleMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const Tag = (`h${level}` as "h1" | "h2" | "h3");
      const className =
        level === 1
          ? "font-display text-2xl font-bold tracking-tight sm:text-3xl"
          : level === 2
            ? "mt-8 font-display text-xl font-semibold"
            : "mt-6 font-display text-lg font-semibold";
      blocks.push(
        <Tag key={`h-${blockKey++}`} className={className}>
          {renderInline(heading[2], `h${blockKey}`)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${blockKey++}`} className="mt-3 list-disc space-y-2 pl-5 text-[var(--muted)]">
          {items.map((item, idx) => (
            <li key={idx} className="text-[var(--fg)]/90">
              {renderInline(item, `li-${blockKey}-${idx}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${blockKey++}`}
          className="mt-3 list-decimal space-y-2 pl-5 text-[var(--muted)]"
        >
          {items.map((item, idx) => (
            <li key={idx} className="text-[var(--fg)]/90">
              {renderInline(item, `ol-${blockKey}-${idx}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={`p-${blockKey++}`} className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
        {renderInline(para.join(" "), `p-${blockKey}`)}
      </p>,
    );
  }

  return <Fragment>{blocks}</Fragment>;
}
