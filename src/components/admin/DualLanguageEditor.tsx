import React from "react";
import { Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DualLanguageConfig } from "@/lib/dualLanguage";
import { TemplateData } from "@/components/templates/InvitationTemplate";

type Props = {
  config: DualLanguageConfig;
  onChange: (updated: DualLanguageConfig) => void;
  baseEvent: Partial<TemplateData>;
};

export default function DualLanguageEditor({
  config,
  onChange,
  baseEvent,
}: Props) {
  const isEnabled = config.enabled;

  const handleToggle = (checked: boolean) => {
    onChange({
      ...config,
      enabled: checked,
    });
  };

  return (
    <div className="space-y-4">
      {/* Dual Language Support (Enable/Disable) */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-card/60 shadow-sm">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold" />
            <span className="font-semibold text-base text-foreground">
              Dual Language Support
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Allow guests to toggle between Khmer (ភាសាខ្មែរ) and English versions on the public invitation.
          </p>
        </div>
        <Switch
          id="dual-language-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          aria-label="Toggle dual language"
        />
      </div>

      {isEnabled && (
        <div className="space-y-3 pt-1">
          {/* Initial Language for Guests (Khmer / English Default Selection) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/30 text-sm">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">Initial Language for Guests</span>
              <p className="text-xs text-muted-foreground">
                Select the initial default language when a guest opens the invitation link.
              </p>
            </div>
            <div className="inline-flex items-center p-1 bg-background rounded-lg border border-border shadow-xs">
              <button
                type="button"
                onClick={() => onChange({ ...config, default_language: "km" })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-smooth ${
                  (config.default_language ?? "km") === "km"
                    ? "bg-gold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇰🇭 Khmer (Default)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, default_language: "en" })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-smooth ${
                  config.default_language === "en"
                    ? "bg-gold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-gold">Bilingual Mode Active: </span>
            Language-specific content fields (Khmer &amp; English) are now displayed directly within each configurable module below (Event details, Agenda, QR code, Apologies, Thank-you letter, and Contacts).
          </div>
        </div>
      )}
    </div>
  );
}
