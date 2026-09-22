import { useState } from "react";
import { Check, X, Heart, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  guestName: string;
  status?: "pending" | "yes" | "no" | string;
  initialPartySize?: number;
  initialMessage?: string;
  submitting?: boolean;
  /** When true, the form is read-only (used for admin preview). */
  preview?: boolean;
  onSubmit?: (status: "yes" | "no", partySize: number, message: string) => void;
  /** Accent (gold) and primary (body) colours — fall through to the
      Khmer Traditional defaults when omitted. Pass-through from the
      parent so all "border-like" / heading colours follow the event's
      configured accent rather than being hard-coded. */
  accentColor?: string;
  primaryColor?: string;
  /** Language version: "km" (Khmer, default) or "en" (English) */
  language?: "km" | "en";
};

/**
 * Premium RSVP card — used by the live invite page and the admin preview.
 * Self-contained state so it can render standalone in preview mode.
 */
export default function RsvpCard({
  guestName,
  status = "pending",
  initialPartySize = 1,
  initialMessage = "",
  submitting = false,
  preview = false,
  onSubmit,
  accentColor,
  primaryColor,
  language = "km",
}: Props) {
  const [partySize, setPartySize] = useState(initialPartySize);
  const [message, setMessage] = useState(initialMessage);

  const accent = accentColor || "#db9b0f";
  const primary = primaryColor || "#3a2a00";

  // Same accent-driven 3-stop gradient used on the cover screens so the
  // guest's name reads as a vibrant gold inside the RSVP card too.
  const nameGradient = `linear-gradient(180deg,
    color-mix(in srgb, ${accent} 35%, #ffffff) 0%,
    color-mix(in srgb, ${accent} 85%, #ffffff) 50%,
    color-mix(in srgb, ${accent} 80%, #ffffff) 100%)`;

  const isEn = language === "en";

  const statusLabel = isEn
    ? status === "yes"
      ? "Attending"
      : status === "no"
      ? "Unable to attend"
      : "Awaiting response"
    : status === "yes"
    ? "នឹងចូលរួម"
    : status === "no"
    ? "សុំទោស មិនអាចចូលរួមបាន"
    : "កំពុងរង់ចាំការឆ្លើយតប";
  const statusBg =
    status === "yes" ? "rgba(34,197,94,0.15)" :
    status === "no" ? "rgba(239,68,68,0.15)" :
                      `${accent}26`;
  const statusColor =
    status === "yes" ? "#16a34a" :
    status === "no" ? "#dc2626" : accent;

  return (
    <section
      className="kt-section-card p-5 sm:p-8 my-6 mx-auto w-full max-w-xl relative overflow-hidden"
      style={{
        // Override the hard-coded gold border baked into `.kt-section-card`
        // so the RSVP card frame follows the configured accent colour.
        borderColor: accent,
        boxShadow: `0 0 12px ${accent}40`,
      }}
    >
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${accent})` }} />
          <Sparkles className="h-4 w-4" style={{ color: accent }} />
          <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${accent})` }} />
        </div>
        <p className="text-[10px] sm:text-xs tracking-[0.4em] uppercase" style={{ color: accent }}>
          R · S · V · P
        </p>
        {/* Heading wraps naturally so the full Khmer question is always visible,
            even on narrow viewports. */}
        <h3
          className={`leading-snug break-words whitespace-normal px-2 ${isEn ? "font-serif font-bold text-xl sm:text-2xl" : "font-khmer-moul"}`}
          style={{
            fontSize: isEn ? undefined : "clamp(0.95rem, 3.2vw, 1.35rem)",
            color: accent,
            textShadow: "1px 1px 0 rgba(255,255,255,0.6), 0 0 6px rgba(255,255,255,0.4)",
          }}
        >
          {isEn ? "Will you be attending our wedding celebration?" : "តើលោកអ្នកនឹងអញ្ជើញមកចូលរួមដែរឬទេ?"}
        </h3>
        <p className={`${isEn ? "font-sans" : "font-khmer-siemreap"} text-sm sm:text-base max-w-md mx-auto leading-relaxed`} style={{ color: primary }}>
          {isEn ? (
            <>
              Dear{" "}
              <span
                className="font-bold"
                style={{
                  background: nameGradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.5))`,
                }}
              >
                {guestName}
              </span>
              , your presence would be our greatest honor and blessing.
            </>
          ) : (
            <>
              ជូនចំពោះ{" "}
              <span
                className="font-bold"
                style={{
                  background: nameGradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.5))`,
                }}
              >
                {guestName}
              </span>{" "}
              វត្តមានរបស់លោកអ្នក គឺជាកិត្តិយសដ៏ធំធេងសម្រាប់ពិធីរបស់យើងខ្ញុំ។
            </>
          )}
        </p>
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border"
          style={{ background: statusBg, color: statusColor, borderColor: `${statusColor}55` }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <div className="my-6 flex items-center justify-center">
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
        <Heart className="h-3.5 w-3.5 mx-3" style={{ color: accent }} />
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
      </div>

      <div className="space-y-3">
        <Label className={`block text-center text-xs sm:text-sm ${isEn ? "font-medium uppercase tracking-wider" : "font-khmer-koulen"}`} style={{ color: accent }}>
          {isEn ? "Number of Guests" : "ចំនួនភ្ញៀវ"}
        </Label>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{ border: `1px solid ${accent}66`, background: "rgba(255,255,255,0.55)", color: accent }}
            disabled={preview || partySize <= 1}
            aria-label="Decrease guests"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="min-w-[80px] text-center">
            <div className={`text-4xl sm:text-5xl leading-none ${isEn ? "font-serif font-bold" : "font-khmer-moul"}`} style={{ color: accent }}>
              {partySize.toString().padStart(2, "0")}
            </div>
            <div className={`text-xs mt-1 ${isEn ? "font-sans uppercase tracking-wider" : "font-khmer-koulen"}`} style={{ color: primary }}>
              {isEn ? (partySize > 1 ? "Guests" : "Guest") : "នាក់"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPartySize(Math.min(20, partySize + 1))}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{ border: `1px solid ${accent}66`, background: "rgba(255,255,255,0.55)", color: accent }}
            disabled={preview || partySize >= 20}
            aria-label="Increase guests"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label className={`block text-center text-xs sm:text-sm ${isEn ? "font-medium uppercase tracking-wider" : "font-khmer-koulen"}`} style={{ color: accent }}>
          {isEn ? "Leave a warm message for the couple" : "សារជូនពរដល់ម្ចាស់ពិធី"}
        </Label>
        <Textarea
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          readOnly={preview}
          placeholder={isEn ? "Wishing you both a lifetime of love, health, and joy..." : "សូមជូនពរឱ្យមានសុភមង្គល និងសេចក្តីស្រឡាញ់ជារៀងរហូត…"}
          className={`resize-none text-center ${isEn ? "font-sans" : "font-khmer-siemreap"}`}
          style={{
            background: "rgba(255,255,255,0.55)",
            border: `1px solid ${accent}55`,
            color: primary,
          }}
        />
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          type="button"
          onClick={() => onSubmit?.("yes", partySize, message)}
          disabled={preview || submitting}
          className={`h-12 tracking-wide text-white hover:opacity-95 ${isEn ? "font-semibold" : "font-khmer-koulen"}`}
          style={{ background: accent, boxShadow: `0 6px 18px ${accent}55` }}
        >
          <Check className="h-4 w-4 mr-2" /> {isEn ? "Joyfully Accept" : "យល់ព្រមចូលរួម"}
        </Button>
        <Button
          size="lg"
          type="button"
          variant="outline"
          onClick={() => onSubmit?.("no", partySize, message)}
          disabled={preview || submitting}
          className={`h-12 tracking-wide bg-transparent hover:bg-white/40 ${isEn ? "font-semibold" : "font-khmer-koulen"}`}
          style={{ borderColor: `${accent}66`, color: primary }}
        >
          <X className="h-4 w-4 mr-2" /> {isEn ? "Regretfully Decline" : "សុំទោស មិនអាចចូលរួម"}
        </Button>
      </div>

      <p className={`mt-4 text-center text-[11px] ${isEn ? "font-sans" : "font-khmer-siemreap"}`} style={{ color: `${primary}99` }}>
        {preview
          ? isEn
            ? "Preview only — guests will click to submit their RSVP"
            : "មើលជាមុន — ភ្ញៀវនឹងចុចដើម្បីឆ្លើយតប"
          : isEn
          ? "Kindly respond at your earliest convenience"
          : "សូមមេត្តាឆ្លើយតបឱ្យបានឆាប់តាមដែលអាចធ្វើបាន"}
      </p>
    </section>
  );
}
