import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TitleAndCoupleFontSize,
  PAGE_TITLE_SIZE_OPTIONS,
  COUPLE_NAME_SIZE_OPTIONS,
  resolvePageTitleFontSize,
  resolveCoupleFontSize,
} from "@/lib/titleAndCoupleSize";
import { Heading, Users, Sparkles, RotateCcw, Eye } from "lucide-react";

export type TitleAndCoupleSizeConfig = {
  page_title_font_size_km?: TitleAndCoupleFontSize | string | null;
  page_title_font_size_en?: TitleAndCoupleFontSize | string | null;
  couple_font_size_km?: TitleAndCoupleFontSize | string | null;
  couple_font_size_en?: TitleAndCoupleFontSize | string | null;
};

export type TitleAndCoupleSizeEditorProps = {
  config: TitleAndCoupleSizeConfig;
  onChange: (patch: Partial<TitleAndCoupleSizeConfig>) => void;
  headerFont?: string | null;
  accentColor?: string | null;
  primaryColor?: string | null;
  sampleTitleKm?: string;
  sampleTitleEn?: string;
  sampleGroomKm?: string;
  sampleBrideKm?: string;
  sampleGroomEn?: string;
  sampleBrideEn?: string;
  className?: string;
};

export default function TitleAndCoupleSizeEditor({
  config,
  onChange,
  headerFont,
  accentColor = "#db9b0f",
  primaryColor = "#3b1d12",
  sampleTitleKm = "សិរីសួស្តី អាពាហ៍ពិពាហ៍",
  sampleTitleEn = "Wedding Celebration",
  sampleGroomKm = "សុខ វិបុល",
  sampleBrideKm = "ចាន់ ធីតា",
  sampleGroomEn = "Vibol Sok",
  sampleBrideEn = "Thida Chan",
  className = "",
}: TitleAndCoupleSizeEditorProps) {
  const [previewLang, setPreviewLang] = useState<"km" | "en">("km");
  const isEn = previewLang === "en";

  const safeAccent = accentColor || "#db9b0f";
  const safePrimary = primaryColor || "#3b1d12";

  // Computed preview sizes
  const currentTitleSize = resolvePageTitleFontSize(
    isEn ? config.page_title_font_size_en : config.page_title_font_size_km,
    isEn
  );

  const currentCoupleSize = resolveCoupleFontSize(
    isEn ? config.couple_font_size_en : config.couple_font_size_km,
    isEn
  );

  const isCustomized =
    Boolean(config.page_title_font_size_km && config.page_title_font_size_km !== "base") ||
    Boolean(config.page_title_font_size_en && config.page_title_font_size_en !== "base") ||
    Boolean(config.couple_font_size_km && config.couple_font_size_km !== "base") ||
    Boolean(config.couple_font_size_en && config.couple_font_size_en !== "base");

  const handleReset = () => {
    onChange({
      page_title_font_size_km: "base",
      page_title_font_size_en: "base",
      couple_font_size_km: "base",
      couple_font_size_en: "base",
    });
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-semibold tracking-wide">
              Invitation Page Title &amp; Couple Names Sizing
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure font sizes separately for Khmer and English pages for the invitation page title and groom/bride names.
          </p>
        </div>

        {isCustomized && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Sizing
          </Button>
        )}
      </div>

      {/* Live Preview Box */}
      <div className="rounded-lg p-3.5 bg-secondary/30 border border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-gold" />
            <span>Invitation Page Live Preview</span>
          </span>
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-md border border-border/60">
            <button
              type="button"
              onClick={() => setPreviewLang("km")}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                !isEn ? "bg-gold text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇰🇭 Khmer
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang("en")}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                isEn ? "bg-gold text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div className="p-5 rounded-md bg-[#fdf5dc] border border-[#d4af37]/30 text-center flex flex-col items-center justify-center space-y-4">
          {/* Main Page Title Preview */}
          <div className="w-full">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block mb-1">
              Page Title ({isEn ? "English" : "Khmer"})
            </span>
            <h2
              className="font-bold leading-tight px-2 transition-all duration-200"
              style={{
                color: safeAccent,
                fontSize: currentTitleSize,
                fontFamily: headerFont || undefined,
              }}
            >
              {isEn ? sampleTitleEn : sampleTitleKm}
            </h2>
          </div>

          <div className="w-24 h-px bg-amber-400/40 my-1" />

          {/* Groom & Bride Names Preview */}
          <div className="w-full max-w-sm">
            <div className="grid grid-cols-2 gap-4 text-center text-xs opacity-75 mb-1" style={{ color: safePrimary }}>
              <span>{isEn ? "Groom" : "កូនប្រុសនាម"}</span>
              <span>{isEn ? "Bride" : "កូនស្រីនាម"}</span>
            </div>
            <div
              className="grid grid-cols-2 gap-4 text-center font-bold transition-all duration-200"
              style={{
                color: safeAccent,
                fontSize: `${currentCoupleSize.maxPx}px`,
                lineHeight: 1.4,
                fontFamily: headerFont || undefined,
              }}
            >
              <span>{isEn ? sampleGroomEn : sampleGroomKm}</span>
              <span>{isEn ? sampleBrideEn : sampleBrideKm}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Columns: Khmer & English Sizing Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Khmer Column */}
        <div className="rounded-lg border border-border p-3.5 space-y-4 bg-secondary/15">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-base">🇰🇭</span>
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Khmer Sizing (ទំហំភាសាខ្មែរ)
            </Label>
          </div>

          {/* Khmer Page Title Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Heading className="h-3.5 w-3.5 text-gold" />
              <span>Khmer Page Title Size (ទំហំចំណងជើង)</span>
            </Label>
            <Select
              value={config.page_title_font_size_km || "base"}
              onValueChange={(val) => onChange({ page_title_font_size_km: val as TitleAndCoupleFontSize })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Standard / Medium (Default)" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TITLE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} ({opt.kmDesc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Controls size of the top {sampleTitleKm} title.</p>
          </div>

          {/* Khmer Groom & Bride Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gold" />
              <span>Khmer Groom &amp; Bride Size (ទំហំឈ្មោះកូនកំលោះ-កូនក្រមុំ)</span>
            </Label>
            <Select
              value={config.couple_font_size_km || "base"}
              onValueChange={(val) => onChange({ couple_font_size_km: val as TitleAndCoupleFontSize })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Standard / Medium (Default)" />
              </SelectTrigger>
              <SelectContent>
                {COUPLE_NAME_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} ({opt.kmDesc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Controls the font scaling of groom and bride names.</p>
          </div>
        </div>

        {/* English Column */}
        <div className="rounded-lg border border-border p-3.5 space-y-4 bg-secondary/15">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-base">🇬🇧</span>
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              English Sizing (English Page)
            </Label>
          </div>

          {/* English Page Title Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Heading className="h-3.5 w-3.5 text-gold" />
              <span>English Page Title Size</span>
            </Label>
            <Select
              value={config.page_title_font_size_en || "base"}
              onValueChange={(val) => onChange({ page_title_font_size_en: val as TitleAndCoupleFontSize })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Standard / Medium (Default)" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TITLE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} ({opt.enDesc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Controls size of the English top header.</p>
          </div>

          {/* English Groom & Bride Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gold" />
              <span>English Groom &amp; Bride Size</span>
            </Label>
            <Select
              value={config.couple_font_size_en || "base"}
              onValueChange={(val) => onChange({ couple_font_size_en: val as TitleAndCoupleFontSize })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Standard / Medium (Default)" />
              </SelectTrigger>
              <SelectContent>
                {COUPLE_NAME_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} ({opt.enDesc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Controls the font scaling of English groom and bride names.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
