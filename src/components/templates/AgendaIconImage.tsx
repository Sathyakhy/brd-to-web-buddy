import React from "react";

export type AgendaIconImageProps = {
  src: string;
  color?: string | null;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
};

/**
 * AgendaIconImage — renders custom PNG/SVG agenda icons.
 * When `color` is specified, it uses CSS masking (`mask-image` / `-webkit-mask-image`)
 * with `background-color: color` so any transparent PNG or SVG icon takes on the exact
 * custom agenda asset color.
 */
export default function AgendaIconImage({
  src,
  color,
  className = "h-6 w-6 sm:h-7 sm:w-7",
  alt = "",
  style,
}: AgendaIconImageProps) {
  if (!src) return null;

  if (color) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`inline-block shrink-0 ${className}`}
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`inline-block object-contain shrink-0 ${className}`}
      style={style}
    />
  );
}
