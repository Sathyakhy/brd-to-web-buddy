import { isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState, CSSProperties, ReactNode } from "react";

/**
 * Renders children on a single line, automatically shrinking the font size
 * so the entire text fits within the parent container's width — never
 * truncates with ellipsis. Re-measures on container resize and content change.
 *
 * Group sizing: pass the same `groupId` to multiple FitText instances and
 * they will all render at the SMALLEST size required by any member, so the
 * group looks visually uniform (e.g. four parent name cells).
 */
interface FitTextProps {
  children: ReactNode;
  maxPx?: number;
  minPx?: number;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "p" | "div";
  /** Optional shared sizing group. All FitTexts with the same id render at the smallest member size. */
  groupId?: string;
  onSizeChange?: (size: number) => void;
}

// Module-level registry of group members and their individually-fitted sizes.
// Members notify the group when their fit changes; the group recomputes the
// shared min and pushes it back to every subscriber.
type GroupEntry = {
  members: Map<symbol, number>;
  subscribers: Set<(size: number) => void>;
};
const groups = new Map<string, GroupEntry>();

function textKeyFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textKeyFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textKeyFromNode(node.props.children);
  return "";
}

function getGroup(id: string): GroupEntry {
  let g = groups.get(id);
  if (!g) {
    g = { members: new Map(), subscribers: new Set() };
    groups.set(id, g);
  }
  return g;
}

function broadcast(id: string) {
  const g = groups.get(id);
  if (!g || g.members.size === 0) return;
  const min = Math.min(...g.members.values());
  g.subscribers.forEach(fn => fn(min));
}

export function FitText({
  children,
  maxPx = 16,
  minPx = 6,
  className,
  style,
  as = "div",
  groupId,
  onSizeChange,
}: FitTextProps) {
  const wrapRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState<number>(maxPx);
  const idRef = useRef<symbol>(Symbol("fittext"));
  const contentKey = useMemo(() => textKeyFromNode(children), [children]);

  // (Subscription is set up inside the layout effect below — `useEffect`
  // runs *after* `useLayoutEffect`, so subscribing here would miss the
  // first round of broadcasts and leave grouped cells at different sizes.)

  // Measure synchronously after layout to avoid a visible flash.
  // Subscription to the shared sizing group is set up here (in the same
  // commit phase as the broadcast) so we never miss the first round of
  // updates from sibling members.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    // Subscribe FIRST so we receive every broadcast — including the one
    // our own `fit()` triggers below and any from siblings that mounted
    // earlier in this same commit.
    let sub: ((s: number) => void) | null = null;
    if (groupId) {
      const g = getGroup(groupId);
      sub = (s: number) => setSize(current => current === s ? current : s);
      g.subscribers.add(sub);
    }

    const fit = () => {
      const available = wrap.clientWidth;
      if (available <= 0) return;
      // Start from maxPx and iteratively shrink until the rendered text
      // fits the available width. This is safer than a single proportional
      // estimate, which can leave Khmer glyphs slightly clipped because
      // their measured `scrollWidth` doesn't always scale linearly with
      // font-size (kerning / hinting rounds per glyph).
      let nextSize = maxPx;
      inner.style.fontSize = `${nextSize}px`;
      // Tiny safety margin so the last glyph never touches the edge.
      const target = Math.max(0, available - 1);
      // Cap iterations defensively.
      for (let i = 0; i < 32 && nextSize > minPx; i++) {
        if (inner.scrollWidth <= target) break;
        nextSize -= 1;
        inner.style.fontSize = `${nextSize}px`;
      }
      if (groupId) {
        // Report this member's required size and let the group decide the
        // shared minimum (which will flow back via the subscriber above).
        const g = getGroup(groupId);
        g.members.set(idRef.current, nextSize);
        broadcast(groupId);
        // Always honour the current group min locally (covers the case
        // where siblings already broadcast a smaller value before we
        // mounted — those broadcasts are gone, but their values are
        // still in the registry).
        if (g.members.size > 0) {
          const min = Math.min(...g.members.values());
          setSize(current => current === min ? current : min);
        }
      } else {
        setSize(current => current === nextSize ? current : nextSize);
      }
    };

    fit();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(wrap);

    // Re-fit once webfonts finish loading — Khmer fonts in particular
    // load asynchronously and change glyph widths after the initial
    // measurement, so without this the cells can end up at different
    // sizes (the cell measured before the font swap stays larger).
    let cancelled = false;
    const refitAfterFonts = () => {
      if (!cancelled) fit();
    };
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(refitAfterFonts).catch(() => {});
    }
    // Belt-and-braces: a couple of delayed re-fits cover the case where
    // the parent container's width changes shortly after mount (scaled
    // preview frame, lazy layout) without firing ResizeObserver again.
    const t1 = window.setTimeout(refitAfterFonts, 150);
    const t2 = window.setTimeout(refitAfterFonts, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (groupId && sub) {
        const g = getGroup(groupId);
        g.subscribers.delete(sub);
        g.members.delete(idRef.current);
        broadcast(groupId);
      }
    };
  }, [contentKey, maxPx, minPx, groupId]);

  useEffect(() => {
    onSizeChange?.(size);
  }, [onSizeChange, size]);

  const Tag = as as any;
  return (
    <Tag
      ref={wrapRef as any}
      className={className}
      style={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        ref={innerRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontSize: `${size}px`,
        }}
      >
        {children}
      </span>
    </Tag>
  );
}

export default FitText;
