import React from "react";

/**
 * Parses markdown-style and HTML-like inline formatting tokens:
 * - `**bold**` or `__bold__` or `<b>bold</b>` or `<strong>bold</strong>` -> <strong>
 * - `*italic*` or `_italic_` or `<i>italic</i>` or `<em>italic</em>` -> <em>
 * - `***bold italic***` or `___bold italic___` -> <strong><em>
 * - `<u>underline</u>` -> <u>
 * - `\n` -> <br />
 */
export function renderFormattedText(
  text: string | null | undefined,
  options?: {
    className?: string;
    style?: React.CSSProperties;
    boldStyle?: React.CSSProperties;
    italicStyle?: React.CSSProperties;
  }
): React.ReactNode {
  if (!text) return null;
  const str = String(text);
  if (!str.trim()) return null;

  // Split lines on newline to preserve carriage returns / line breaks
  const lines = str.split(/\r?\n/);

  const formattedLines = lines.map((line, lineIdx) => {
    // If line has no formatting markup, return plain string
    if (!/[*_<>]/g.test(line)) {
      return <React.Fragment key={`line-${lineIdx}`}>{line}</React.Fragment>;
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parseInlineFormatting(line, options)}
      </React.Fragment>
    );
  });

  if (formattedLines.length === 1) {
    return formattedLines[0];
  }

  return formattedLines.map((l, i) => (
    <React.Fragment key={`wrap-${i}`}>
      {i > 0 && <br />}
      {l}
    </React.Fragment>
  ));
}

/**
 * Tokenizes and parses inline markdown/html tags into React components.
 */
function parseInlineFormatting(
  text: string,
  options?: {
    boldStyle?: React.CSSProperties;
    italicStyle?: React.CSSProperties;
  }
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  
  // Regex pattern matching:
  // 1. `***...***` or `___...___` (bold italic)
  // 2. `**...**` or `__...__` (bold)
  // 3. `*...*` or `_..._` (italic)
  // 4. `<b>...</b>` or `<strong>...</strong>`
  // 5. `<i>...</i>` or `<em>...</em>`
  // 6. `<u>...</u>`
  const pattern = /(\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|<b>(.*?)<\/b>|<strong>(.*?)<\/strong>|\*([^*]+)\*|_([^_]+)_|<i>(.*?)<\/i>|<em>(.*?)<\/em>|<u>(.*?)<\/u>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Add text before match
    if (matchIndex > lastIndex) {
      nodes.push(text.substring(lastIndex, matchIndex));
    }

    const fullMatch = match[0];
    
    // 1. Bold + Italic: `***text***` or `___text___`
    if (match[2] || match[3]) {
      const inner = match[2] || match[3];
      nodes.push(
        <strong
          key={`bi-${matchIndex}`}
          className="font-bold italic"
          style={{ fontWeight: 700, fontStyle: "italic", ...(options?.boldStyle || {}) }}
        >
          {inner}
        </strong>
      );
    }
    // 2. Bold: `**text**`, `__text__`, `<b>text</b>`, `<strong>text</strong>`
    else if (match[4] || match[5] || match[6] || match[7]) {
      const inner = match[4] || match[5] || match[6] || match[7];
      nodes.push(
        <strong
          key={`b-${matchIndex}`}
          className="font-bold"
          style={{ fontWeight: 700, ...(options?.boldStyle || {}) }}
        >
          {inner}
        </strong>
      );
    }
    // 3. Italic: `*text*`, `_text_`, `<i>text</i>`, `<em>text</em>`
    else if (match[8] || match[9] || match[10] || match[11]) {
      const inner = match[8] || match[9] || match[10] || match[11];
      nodes.push(
        <em
          key={`i-${matchIndex}`}
          className="italic"
          style={{ fontStyle: "italic", ...(options?.italicStyle || {}) }}
        >
          {inner}
        </em>
      );
    }
    // 4. Underline: `<u>text</u>`
    else if (match[12]) {
      const inner = match[12];
      nodes.push(
        <u key={`u-${matchIndex}`} className="underline underline-offset-2">
          {inner}
        </u>
      );
    } else {
      nodes.push(fullMatch);
    }

    lastIndex = pattern.lastIndex;
  }

  // Add trailing string
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}

/**
 * Strips all markdown and HTML tags from a string for plain-text contexts.
 */
export function stripFormatting(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/___([^_]+)___/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "");
}
