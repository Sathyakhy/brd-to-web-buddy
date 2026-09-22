import { Globe } from "lucide-react";
import { LanguageCode } from "@/lib/dualLanguage";

type Props = {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  accentColor?: string;
  positionMode?: "fixed" | "absolute" | "inline";
  /** If floating standalone without a music player container, adjust position */
  hasBottomContact?: boolean;
  className?: string;
};

/**
 * Floating Language Switch button.
 * Placed cleanly below the Music icon in the bottom-right corner.
 * Allows visitors and previewers to toggle seamlessly between Khmer (KM) and English (EN).
 */
export default function FloatingLanguageSwitch({
  language,
  onLanguageChange,
  accentColor = "#db9b0f",
  positionMode = "inline",
  hasBottomContact = false,
  className = "",
}: Props) {
  const accent = accentColor && accentColor.trim() ? accentColor.trim() : "#db9b0f";

  let wrapperClass = className;
  if (positionMode === "fixed") {
    wrapperClass = `${
      hasBottomContact
        ? "fixed bottom-24 right-5 z-[9999] sm:bottom-28 sm:right-6"
        : "fixed bottom-5 right-5 z-[9999] sm:bottom-6 sm:right-6"
    } ${className}`;
  } else if (positionMode === "absolute") {
    wrapperClass = `absolute bottom-4 right-4 z-40 ${className}`;
  }

  return (
    <div className={`select-none ${wrapperClass}`}>
      <div
        className="inline-flex items-center gap-1 p-1 rounded-full backdrop-blur-md shadow-lg transition-transform active:scale-95"
        style={{
          background: "linear-gradient(135deg, rgba(22, 17, 10, 0.88), rgba(12, 9, 5, 0.94))",
          border: `1.5px solid ${accent}70`,
          boxShadow: `0 8px 20px rgba(0, 0, 0, 0.35), 0 0 12px ${accent}25`,
        }}
        role="group"
        aria-label="Language switch"
      >
        <span className="pl-1.5 pr-0.5 text-muted-foreground flex items-center justify-center">
          <Globe
            className="w-3.5 h-3.5 transition-colors"
            style={{ color: accent }}
          />
        </span>

        {/* Khmer Option */}
        <button
          type="button"
          onClick={() => onLanguageChange("km")}
          className={`px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            language === "km"
              ? "text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          style={
            language === "km"
              ? {
                  backgroundColor: accent,
                  boxShadow: `0 2px 8px ${accent}60`,
                }
              : undefined
          }
          aria-pressed={language === "km"}
          title="Switch to Khmer (ភាសាខ្មែរ)"
        >
          KM
        </button>

        {/* English Option */}
        <button
          type="button"
          onClick={() => onLanguageChange("en")}
          className={`px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            language === "en"
              ? "text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          style={
            language === "en"
              ? {
                  backgroundColor: accent,
                  boxShadow: `0 2px 8px ${accent}60`,
                }
              : undefined
          }
          aria-pressed={language === "en"}
          title="Switch to English"
        >
          EN
        </button>
      </div>
    </div>
  );
}
