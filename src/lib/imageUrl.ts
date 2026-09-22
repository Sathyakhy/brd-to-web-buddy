/**
 * Build a Supabase Storage transform URL when possible, otherwise return as-is.
 * Public bucket URLs look like: `…/storage/v1/object/public/<bucket>/<path>`.
 * The transform endpoint is:    `…/storage/v1/render/image/public/<bucket>/<path>?…`.
 */
export function transformImage(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number; resize?: "cover" | "contain" | "fill" } = {}
): string {
  if (!url) return "";
  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/public/")) return url;

  const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));
  if (opts.resize) params.set("resize", opts.resize);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Convenience: gallery thumbnail — small but visually crisp.
 *  Uses `contain` on the server so no pixels are pre-cropped; the CSS layer
 *  then applies `object-cover` to fit the tile without double-cropping. */
export function thumbUrl(url: string, width = 480) {
  return transformImage(url, { width, quality: 70, resize: "contain" });
}

/** Convenience: medium "preview" used by the lightbox while the
 *  full-resolution image is still downloading. */
export function previewUrl(url: string, width = 1280) {
  return transformImage(url, { width, quality: 85, resize: "contain" });
}

/** Convenience: lightbox full view — near-original quality at display size. */
export function fullUrl(url: string, width = 1920) {
  return transformImage(url, { width, quality: 95, resize: "contain" });
}

