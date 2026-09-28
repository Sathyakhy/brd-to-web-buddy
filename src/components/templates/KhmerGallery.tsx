import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { thumbUrl, previewUrl, fullUrl } from "@/lib/imageUrl";


export type GalleryLayout = "grid" | "mosaic";

type Props = {
  images: string[];
  layout?: GalleryLayout;
};

type TouchMode = "none" | "swipe" | "pan" | "pinch";

/**
 * Cache of full-resolution image URLs we've already finished loading at
 * least once during this page session. Lives at module scope so it
 * survives unmount/remount of the gallery and so re-opening a previously
 * viewed photo can skip the spinner entirely.
 */
const loadedFullCache = new Set<string>();

export default function KhmerGallery({ images, layout = "grid" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Three-tier source state. The lightbox layers them on top of each other
  // so the user sees something sharp immediately:
  //   thumb   → already cached from the gallery grid (instant).
  //   preview → ~960px medium quality, arrives in a few hundred ms.
  //   full    → 1920px high quality, swapped in when ready.
  const [thumbSrc, setThumbSrc] = useState<string>("");
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [fullSrc, setFullSrc] = useState<string>("");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);


  const visibleImages = useMemo(() => {
    if (layout !== "mosaic") return images;
    return images.slice(0, Math.floor(images.length / 3) * 3);
  }, [images, layout]);

  const touchState = useRef<{
    mode: TouchMode;
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
    startDist: number;
    startZoom: number;
  }>({
    mode: "none",
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
    startDist: 0,
    startZoom: 1,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const thumbs = containerRef.current.querySelectorAll<HTMLImageElement>("img[data-fade]");
    const observer = new IntersectionObserver(
      async (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target as HTMLImageElement;
          try {
            if ("decode" in img) await img.decode();
          } catch {}
          img.classList.add("opacity-100");
          obs.unobserve(img);
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    thumbs.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [visibleImages.length, layout]);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(() => {
    setActive((current) => (current === null ? null : (current - 1 + visibleImages.length) % visibleImages.length));
  }, [visibleImages.length]);
  const next = useCallback(() => {
    setActive((current) => (current === null ? null : (current + 1) % visibleImages.length));
  }, [visibleImages.length]);

  useEffect(() => {
    if (active === null) return;
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKeys);
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.removeEventListener("keydown", handleKeys);
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [active, close, next, prev]);

  // Whenever the active index changes, set up the three image tiers and
  // start downloading the medium + full versions in parallel. The thumb
  // (already in the browser cache from the grid) renders instantly so the
  // user never sees a blank screen, even on slow connections.
  useEffect(() => {
    if (active === null) {
      setThumbSrc("");
      setPreviewSrc("");
      setFullSrc("");
      setPreviewLoaded(false);
      setFullLoaded(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const raw = visibleImages[active];
    const tSrc = thumbUrl(raw, 480);
    const pSrc = previewUrl(raw, 960);
    const fSrc = fullUrl(raw, 1920);
    const cached = loadedFullCache.has(fSrc);

    setThumbSrc(tSrc);
    setPreviewSrc(pSrc);
    setFullSrc(fSrc);
    // If we've already loaded this full URL once, skip straight to the
    // sharp version — no fade, no spinner.
    setPreviewLoaded(cached);
    setFullLoaded(cached);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    if (cached) return;

    let cancelled = false;

    const previewLoader = new Image();
    previewLoader.decoding = "async";
    (previewLoader as any).fetchPriority = "high";
    previewLoader.src = pSrc;
    previewLoader.onload = () => { if (!cancelled) setPreviewLoaded(true); };
    previewLoader.onerror = () => { if (!cancelled) setPreviewLoaded(true); };

    const fullLoader = new Image();
    fullLoader.decoding = "async";
    (fullLoader as any).fetchPriority = "high";
    fullLoader.src = fSrc;
    fullLoader.onload = () => {
      loadedFullCache.add(fSrc);
      if (!cancelled) setFullLoaded(true);
    };
    fullLoader.onerror = () => { if (!cancelled) setFullLoaded(true); };

    return () => { cancelled = true; };
  }, [active, visibleImages]);

  // Aggressively warm the cache for the neighbouring slides — both the
  // medium "preview" tier (so swiping feels instant) and the full version
  // (so the sharp swap is already done by the time the user gets there).
  useEffect(() => {
    if (active === null) return;
    const neighbours = [
      (active + 1) % visibleImages.length,
      (active - 1 + visibleImages.length) % visibleImages.length,
    ];
    neighbours.forEach((index) => {
      const raw = visibleImages[index];
      const p = new Image();
      p.decoding = "async";
      p.src = previewUrl(raw, 960);
      const f = new Image();
      f.decoding = "async";
      f.src = fullUrl(raw, 1920);
      f.onload = () => loadedFullCache.add(f.src);
    });
  }, [active, visibleImages]);

  const clampZoom = (value: number) => Math.max(1, Math.min(4, value));

  const changeZoom = (delta: number) => {
    setZoom((current) => {
      const nextZoom = clampZoom(current + delta);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const touchDistance = (a: React.Touch, b: React.Touch) => {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      touchState.current = {
        mode: "pinch",
        startX: 0,
        startY: 0,
        startPan: pan,
        startDist: touchDistance(event.touches[0], event.touches[1]),
        startZoom: zoom,
      };
      return;
    }

    if (event.touches.length === 1) {
      touchState.current = {
        mode: zoom > 1 ? "pan" : "swipe",
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        startPan: pan,
        startDist: 0,
        startZoom: zoom,
      };
    }
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const state = touchState.current;
    if (state.mode === "pinch" && event.touches.length === 2) {
      const ratio = touchDistance(event.touches[0], event.touches[1]) / (state.startDist || 1);
      setZoom(clampZoom(state.startZoom * ratio));
      return;
    }

    if (state.mode === "pan" && event.touches.length === 1) {
      setPan({
        x: state.startPan.x + (event.touches[0].clientX - state.startX),
        y: state.startPan.y + (event.touches[0].clientY - state.startY),
      });
    }
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const state = touchState.current;
    if (state.mode === "swipe" && event.changedTouches.length > 0) {
      const dx = event.changedTouches[0].clientX - state.startX;
      const dy = event.changedTouches[0].clientY - state.startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dx > 0 ? prev() : next();
      }
    }

    if (zoom <= 1.02) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
    touchState.current.mode = "none";
  };

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
  };

  const onDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    setZoom(2);
  };

  if (!visibleImages.length) return null;

  const tileClass = "relative overflow-hidden rounded-md bg-muted/30 shadow-sm ring-1 ring-border/50";

  const renderTile = (src: string, index: number, extraClass = "") => {
    const smallThumb = thumbUrl(src, 240);
    const normalThumb = thumbUrl(src, 480);
    return (
      <button
        key={`${src}-${index}`}
        type="button"
        onClick={() => setActive(index)}
        className={`${tileClass} ${extraClass}`}
      >
        <img
          data-fade
          src={normalThumb}
          srcSet={`${smallThumb} 240w, ${normalThumb} 480w`}
          sizes="(max-width: 640px) 50vw, 33vw"
          alt={`gallery-${index + 1}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500"
        />
      </button>
    );
  };

  const lightbox = active !== null && mounted
    ? createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95" style={{ height: "100dvh" }}>
          {/* Subtle top loading bar — only visible until the high-quality
              version finishes downloading. We don't show a percentage
              anymore because the user already sees the picture (the thumb
              and medium tier render instantly). */}
          {!fullLoaded && (
            <div className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-white/10">
              <div className="h-full w-1/3 animate-[gallery-progress_1.2s_ease-in-out_infinite] bg-white/80" />
            </div>
          )}

          <button
            type="button"
            onClick={close}
            onTouchEnd={(event) => {
              event.preventDefault();
              event.stopPropagation();
              close();
            }}
            className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 pt-14 sm:pt-0 sm:top-4">
            <button
              type="button"
              onClick={() => changeZoom(-0.5)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-40"
              disabled={zoom <= 1}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => changeZoom(0.5)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-40"
              disabled={zoom >= 4}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <div className="rounded-full bg-black/55 px-3 py-1.5 text-xs tabular-nums text-white">
              {active + 1} / {visibleImages.length}
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white sm:left-6 sm:h-14 sm:w-14"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white sm:right-6 sm:h-14 sm:w-14"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden px-14 py-20 sm:px-20"
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
          >
            {/* Three stacked layers — bottom to top: thumb, preview, full.
                Each higher tier fades in on top once it's ready, so the
                user always sees the sharpest version available so far.
                The transform/zoom is applied to the wrapping container so
                all three layers stay perfectly aligned. */}
            <div
              className="relative will-change-transform"
              onClick={(event) => event.stopPropagation()}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: touchState.current.mode === "none" ? "transform 160ms ease" : "none",
              }}
            >
              {/* Tier 1 — instant thumbnail. Already in the browser cache
                  from the gallery grid, so it paints on the first frame
                  and dictates the wrapping element's size. */}
              {thumbSrc && (
                <img
                  src={thumbSrc}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="block max-h-[100dvh] max-w-[100vw] object-contain"
                  style={{
                    filter: previewLoaded ? "none" : "blur(8px)",
                    transition: "filter 200ms ease",
                  }}
                />
              )}

              {/* Tier 2 — medium preview (~960px). Sharp enough for most
                  phone screens and arrives much faster than the full HQ
                  version. Fades in as soon as it's decoded. */}
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  decoding="async"
                  className="absolute inset-0 block h-full w-full object-contain"
                  onLoad={() => setPreviewLoaded(true)}
                  style={{
                    opacity: previewLoaded ? 1 : 0,
                    transition: "opacity 160ms ease",
                  }}
                />
              )}

              {/* Tier 3 — full high-quality (1920px / q90). Swapped in
                  silently when ready; visually identical so the user
                  doesn't notice the swap, but pinch-zoom now reveals the
                  extra detail. */}
              {fullSrc && (
                <img
                  src={fullSrc}
                  alt={`fullscreen-${active + 1}`}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 block h-full w-full object-contain"
                  onLoad={() => {
                    loadedFullCache.add(fullSrc);
                    setFullLoaded(true);
                  }}
                  style={{
                    opacity: fullLoaded ? 1 : 0,
                    transition: "opacity 200ms ease",
                  }}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {layout === "mosaic" ? (
        <div ref={containerRef} className="flex flex-col gap-3 sm:gap-4">
          {Array.from({ length: visibleImages.length / 3 }).map((_, groupIndex) => {
            const base = groupIndex * 3;
            const portraitLeft = groupIndex % 2 === 0;
            return (
              <div
                key={`group-${groupIndex}`}
                className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4"
                style={{ aspectRatio: "3 / 2" }}
              >
                {portraitLeft ? (
                  <>
                    {renderTile(visibleImages[base], base, "row-span-2 col-start-1")}
                    {renderTile(visibleImages[base + 1], base + 1, "col-start-2 row-start-1")}
                    {renderTile(visibleImages[base + 2], base + 2, "col-start-2 row-start-2")}
                  </>
                ) : (
                  <>
                    {renderTile(visibleImages[base], base, "col-start-1 row-start-1")}
                    {renderTile(visibleImages[base + 1], base + 1, "col-start-1 row-start-2")}
                    {renderTile(visibleImages[base + 2], base + 2, "row-span-2 col-start-2")}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div ref={containerRef} className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
          {visibleImages.map((src, index) => renderTile(src, index, "aspect-[3/4]"))}
        </div>
      )}

      {lightbox}
    </>
  );
}