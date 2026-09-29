export type TitleAndCoupleFontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

export const PAGE_TITLE_SIZE_OPTIONS: { value: TitleAndCoupleFontSize; label: string; kmDesc: string; enDesc: string }[] = [
  { value: "xs", label: "Extra Small (XS)", kmDesc: "1.2rem - 1.7rem", enDesc: "1.1rem - 1.5rem" },
  { value: "sm", label: "Small (SM)", kmDesc: "1.5rem - 2.2rem", enDesc: "1.4rem - 2.0rem" },
  { value: "base", label: "Standard / Medium (Default)", kmDesc: "1.8rem - 2.8rem", enDesc: "1.7rem - 2.6rem" },
  { value: "lg", label: "Large (LG)", kmDesc: "2.2rem - 3.4rem", enDesc: "2.1rem - 3.2rem" },
  { value: "xl", label: "Extra Large (XL)", kmDesc: "2.6rem - 4.0rem", enDesc: "2.5rem - 3.8rem" },
  { value: "2xl", label: "2X Large (2XL)", kmDesc: "3.0rem - 4.6rem", enDesc: "2.9rem - 4.4rem" },
];

export const COUPLE_NAME_SIZE_OPTIONS: { value: TitleAndCoupleFontSize; label: string; kmDesc: string; enDesc: string }[] = [
  { value: "xs", label: "Extra Small (XS)", kmDesc: "16px", enDesc: "16px" },
  { value: "sm", label: "Small (SM)", kmDesc: "19px", enDesc: "19px" },
  { value: "base", label: "Standard / Medium (Default)", kmDesc: "22px", enDesc: "22px" },
  { value: "lg", label: "Large (LG)", kmDesc: "27px", enDesc: "27px" },
  { value: "xl", label: "Extra Large (XL)", kmDesc: "32px", enDesc: "32px" },
  { value: "2xl", label: "2X Large (2XL)", kmDesc: "38px", enDesc: "38px" },
  { value: "3xl", label: "3X Large (3XL)", kmDesc: "46px", enDesc: "46px" },
];

/**
 * Resolves font-size CSS string for the invitation page title (h1)
 */
export function resolvePageTitleFontSize(
  size: TitleAndCoupleFontSize | string | null | undefined,
  isEn: boolean
): string {
  const s = size || "base";

  switch (s) {
    case "xs":
      return isEn ? "clamp(1.1rem, 2.5vw, 1.5rem)" : "clamp(1.2rem, 2.7vw, 1.7rem)";
    case "sm":
      return isEn ? "clamp(1.4rem, 3.2vw, 2.0rem)" : "clamp(1.5rem, 3.4vw, 2.2rem)";
    case "base":
      return isEn ? "clamp(1.7rem, 3.8vw, 2.6rem)" : "clamp(1.8rem, 4vw, 2.8rem)";
    case "lg":
      return isEn ? "clamp(2.1rem, 4.6vw, 3.2rem)" : "clamp(2.2rem, 4.8vw, 3.4rem)";
    case "xl":
      return isEn ? "clamp(2.5rem, 5.4vw, 3.8rem)" : "clamp(2.6rem, 5.6vw, 4.0rem)";
    case "2xl":
      return isEn ? "clamp(2.9rem, 6.2vw, 4.4rem)" : "clamp(3.0rem, 6.4vw, 4.6rem)";
    default:
      if (typeof s === "string" && (s.includes("px") || s.includes("rem") || s.includes("clamp"))) {
        return s;
      }
      return isEn ? "clamp(1.7rem, 3.8vw, 2.6rem)" : "clamp(1.8rem, 4vw, 2.8rem)";
  }
}

/**
 * Resolves maxPx and minPx bounds for FitText on groom and bride names
 */
export function resolveCoupleFontSize(
  size: TitleAndCoupleFontSize | string | null | undefined,
  isEn: boolean
): { maxPx: number; minPx: number; fontClass?: string } {
  const s = size || "base";

  switch (s) {
    case "xs":
      return { maxPx: 16, minPx: 8, fontClass: isEn ? "font-bold text-base sm:text-lg" : "" };
    case "sm":
      return { maxPx: 19, minPx: 9, fontClass: isEn ? "font-bold text-base sm:text-lg" : "" };
    case "base":
      return { maxPx: 22, minPx: 10, fontClass: isEn ? "font-bold text-lg sm:text-xl" : "" };
    case "lg":
      return { maxPx: 27, minPx: 12, fontClass: isEn ? "font-bold text-xl sm:text-2xl" : "" };
    case "xl":
      return { maxPx: 32, minPx: 14, fontClass: isEn ? "font-bold text-2xl sm:text-3xl" : "" };
    case "2xl":
      return { maxPx: 38, minPx: 16, fontClass: isEn ? "font-bold text-3xl sm:text-4xl" : "" };
    case "3xl":
      return { maxPx: 46, minPx: 18, fontClass: isEn ? "font-bold text-4xl sm:text-5xl" : "" };
    default:
      if (typeof s === "number") {
        return { maxPx: s, minPx: Math.max(8, Math.floor(s / 2)), fontClass: isEn ? "font-bold" : "" };
      }
      return { maxPx: 22, minPx: 10, fontClass: isEn ? "font-bold text-lg sm:text-xl" : "" };
  }
}
