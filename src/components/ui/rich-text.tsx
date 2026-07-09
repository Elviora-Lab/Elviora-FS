import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Lightweight, dependency-free renderer for a safe subset of Markdown, so
 * product descriptions (and other authored copy) render with real structure
 * instead of one flat block of text.
 *
 * Supported syntax:
 *   # / ## / ###  → section headings
 *   - / * / •     → bullet list (consecutive lines group into one list)
 *   1. / 2)       → numbered list
 *   **bold**  *italic*
 *   blank line    → new paragraph; single newline → line break
 *
 * It builds React elements (never injects raw HTML), so untrusted input can't
 * introduce markup or scripts.
 */

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'h'; level: number; text: string };

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*•]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', lines: para });
    if (ul.length) blocks.push({ kind: 'ul', items: ul });
    if (ol.length) blocks.push({ kind: 'ol', items: ol });
    para = [];
    ul = [];
    ol = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const [, hashes = '', headingText = ''] = heading;
      flush();
      blocks.push({ kind: 'h', level: hashes.length, text: headingText });
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      if (para.length || ol.length) flush();
      ul.push(bullet[1] ?? '');
      continue;
    }

    const ordered = ORDERED.exec(line);
    if (ordered) {
      if (para.length || ul.length) flush();
      ol.push(ordered[1] ?? '');
      continue;
    }

    if (ul.length || ol.length) flush();
    para.push(line);
  }
  flush();
  return blocks;
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter((part) => part !== '')
    .map((part, i) => {
      const key = `${keyBase}-${i}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-medium text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      return <Fragment key={key}>{part}</Fragment>;
    });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h':
            return (
              <p
                key={i}
                className={cn(
                  'font-serif font-medium text-foreground',
                  block.level === 1 ? 'text-base' : 'text-sm',
                )}
              >
                {renderInline(block.text, `h-${i}`)}
              </p>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-foreground/40">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `ul-${i}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-foreground/40">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `ol-${i}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'p':
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 ? <br /> : null}
                    {renderInline(line, `p-${i}-${j}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
