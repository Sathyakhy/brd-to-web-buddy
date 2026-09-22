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

  const statusLabel =
    status === "yes" ? "នឹងចូលរួម" :
    status === "no" ? "សុំទោស មិនអាចចូលរួមបាន" : "កំពុងរង់ចាំការឆ្លើយតប";
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
          className="font-khmer-moul leading-snug break-words whitespace-normal px-2"
          style={{
            fontSize: "clamp(0.95rem, 3.2vw, 1.35rem)",
            color: accent,
            textShadow: "1px 1px 0 rgba(255,255,255,0.6), 0 0 6px rgba(255,255,255,0.4)",
          }}
        >
          តើលោកអ្នកនឹងអញ្ជើញមកចូលរួមដែរឬទេ?
        </h3>
        <p className="font-khmer-siemreap text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: primary }}>
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
        <Label className="block text-center text-xs sm:text-sm font-khmer-koulen" style={{ color: accent }}>
          ចំនួនភ្ញៀវ
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
            <div className="font-khmer-moul text-4xl sm:text-5xl leading-none" style={{ color: accent }}>
              {partySize.toString().padStart(2, "0")}
            </div>
            <div className="font-khmer-koulen text-xs mt-1" style={{ color: primary }}>
              នាក់
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
        <Label className="block text-center text-xs sm:text-sm font-khmer-koulen" style={{ color: accent }}>
          សារជូនពរដល់ម្ចាស់ពិធី
        </Label>
        <Textarea
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          readOnly={preview}
          placeholder="សូមជូនពរឱ្យមានសុភមង្គល និងសេចក្តីស្រឡាញ់ជារៀងរហូត…"
          className="resize-none text-center font-khmer-siemreap"
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
          className="h-12 font-khmer-koulen tracking-wide text-white hover:opacity-95"
          style={{ background: accent, boxShadow: `0 6px 18px ${accent}55` }}
        >
          <Check className="h-4 w-4 mr-2" /> យល់ព្រមចូលរួម
        </Button>
        <Button
          size="lg"
          type="button"
          variant="outline"
          onClick={() => onSubmit?.("no", partySize, message)}
          disabled={preview || submitting}
          className="h-12 font-khmer-koulen tracking-wide bg-transparent hover:bg-white/40"
          style={{ borderColor: `${accent}66`, color: primary }}
        >
          <X className="h-4 w-4 mr-2" /> សុំទោស មិនអាចចូលរួម
        </Button>
      </div>

      <p className="mt-4 text-center text-[11px] font-khmer-siemreap" style={{ color: `${primary}99` }}>
        {preview ? "មើលជាមុន — ភ្ញៀវនឹងចុចដើម្បីឆ្លើយតប" : "សូមមេត្តាឆ្លើយតបឱ្យបានឆាប់តាមដែលអាចធ្វើបាន"}
      </p>
    </section>
  );
}
