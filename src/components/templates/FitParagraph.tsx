import { useLayoutEffect, useRef, useState, CSSProperties, ReactNode } from "react";

/**
 * Renders text as a wrapping paragraph that automatically shrinks its font
 * size until the rendered content fits within a maximum number of lines.
 * Letters are NOT spaced; the text wraps naturally on word boundaries.
 *
 * Re-measures on container resize so it adapts to mobile / tablet / desktop.
 */
interface FitParagraphProps {
  children: ReactNode;
  /** Maximum number of visible lines. Default 4.
   *  Can be a single number (used at every viewport), or a responsive object
   *  keyed by minimum container width in px (e.g. `{ 0: 4, 640: 3, 1024: 2 }`
   *  means 4 lines under 640px, 3 lines from 640-1023px, 2 lines from 1024px). */
  maxLines?: number | Record<number, number>;
  /** Maximum (preferred) font size in px. */
  maxPx?: number;
  /** Minimum font size in px (won't shrink below). */
  minPx?: number;
  /** Line-height multiplier. */
  lineHeight?: number;
  className?: string;
  style?: CSSProperties;
  as?: "p" | "div";
}

export function FitParagraph({
  children,
  maxLines = 4,
  maxPx = 16,
  minPx = 7,
  lineHeight = 1.7,
  className,
  style,
  as = "div",
}: FitParagraphProps) {
  const wrapRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState<number>(maxPx);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    // Resolve maxLines for the current container width. When a responsive
    // map is provided, pick the largest breakpoint <= current width.
    const resolveMaxLines = (width: number): number => {
      if (typeof maxLines === "number") return maxLines;
      const entries = Object.entries(maxLines)
        .map(([k, v]) => [Number(k), v as number] as const)
        .sort((a, b) => a[0] - b[0]);
      let chosen = entries[0]?.[1] ?? 4;
      for (const [bp, lines] of entries) {
        if (width >= bp) chosen = lines;
      }
      return chosen;
    };

    const fit = () => {
      const containerWidth = wrap.clientWidth;
      const effectiveMaxLines = resolveMaxLines(containerWidth);
      const countRenderedLines = () => {
        const content = contentRef.current;
        if (!content) return 1;
        const range = document.createRange();
        range.selectNodeContents(content);
        const rects = Array.from(range.getClientRects());
        range.detach?.();
        if (!rects.length) return 1;

        const tops: number[] = [];
        for (const rect of rects) {
          const top = Math.round(rect.top * 10) / 10;
          if (!tops.some((value) => Math.abs(value - top) < 0.75)) {
            tops.push(top);
          }
        }
        return tops.length || 1;
      };

      let lo = minPx;
      let hi = maxPx;
      let best = minPx;
      for (let i = 0; i < 16 && hi - lo > 0.1; i++) {
        const mid = (lo + hi) / 2;
        inner.style.fontSize = `${mid}px`;
        inner.style.lineHeight = String(lineHeight);
        const lineCount = countRenderedLines();
        if (lineCount <= effectiveMaxLines) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      setSize(best);
    };

    fit();
    // Defer ResizeObserver-triggered fits to the next frame to avoid the
    // "ResizeObserver loop completed with undelivered notifications" warning.
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [children, maxLines, maxPx, minPx, lineHeight]);

  const Tag = as as any;
  return (
    <Tag
      ref={wrapRef as any}
      className={className}
      style={{
        ...style,
        width: "100%",
      }}
    >
      <span
        ref={innerRef}
        style={{
          display: "block",
          fontSize: `${size}px`,
          lineHeight,
          // Natural wrapping — no letter-spacing, words break on whitespace.
          letterSpacing: 0,
          wordBreak: "normal",
          overflowWrap: "break-word",
          whiteSpace: "normal",
          // Balance line lengths so each row is approximately the same width
          // (instead of one long line + a short tail). Falls back gracefully
          // to normal wrapping in browsers that don't support it.
          textWrap: "balance" as any,
        }}
      >
        <span ref={contentRef}>{children}</span>
      </span>
    </Tag>
  );
}

export default FitParagraph;
