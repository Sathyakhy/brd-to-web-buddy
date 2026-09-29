import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CoverInvitationStyle,
  CoverInvitationFontSize,
  DEFAULT_COVER_INVITATION_STYLE,
  getCoverInvitationFontSizeStyle,
  resolveCoverInvitationFont,
} from "@/lib/coverInvitationStyle";
import {
  HEADER_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
} from "@/lib/fonts";
import {
  Sparkles,
  RotateCcw,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Globe,
  Type,
  Palette,
} from "lucide-react";

export type CoverInvitationStyleEditorProps = {
  config: CoverInvitationStyle;
  onChange: (patch: Partial<CoverInvitationStyle>) => void;
  defaultAccentColor?: string | null;
  className?: string;
};

const FONT_SIZE_OPTIONS: { value: CoverInvitationFontSize; label: string; enDesc: string }[] = [
  { value: "xs", label: "Extra Small (XS)", enDesc: "0.75rem / 0.9rem" },
  { value: "sm", label: "Small (SM)", enDesc: "0.875rem / 1.05rem" },
  { value: "base", label: "Standard / Medium (Default)", enDesc: "1.0rem / 1.25rem" },
  { value: "lg", label: "Large (LG)", enDesc: "1.15rem / 1.45rem" },
  { value: "xl", label: "Extra Large (XL)", enDesc: "1.35rem / 1.7rem" },
  { value: "2xl", label: "2X Large (2XL)", enDesc: "1.6rem / 2.0rem" },
  { value: "3xl", label: "3X Large (3XL)", enDesc: "1.9rem / 2.4rem" },
];

export default function CoverInvitationStyleEditor({
  config,
  onChange,
  defaultAccentColor = "#1a1a1a",
  className = "",
}: CoverInvitationStyleEditorProps) {
  const [previewLang, setPreviewLang] = useState<"km" | "en">("km");
  const isEn = previewLang === "en";

  const safeColor = config.color || (defaultAccentColor ?? "#1a1a1a");
  const activeText = isEn
    ? (config.text_en?.trim() || "INVITATION")
    : (config.text_km?.trim() || "សូមគោរពអញ្ជើញ");

  const resolvedFont = isEn
    ? resolveCoverInvitationFont(config.font_en, true)
    : resolveCoverInvitationFont(config.font_km, false);

  const fontSizeStyle = getCoverInvitationFontSizeStyle(config.font_size, isEn);

  const isBold = config.is_bold ?? (isEn ? true : false);
  const isItalic = config.is_italic ?? false;
  const isUnderline = config.show_underline ?? true;

  const isCustomized =
    Boolean(config.text_km) ||
    Boolean(config.text_en) ||
    Boolean(config.color) ||
    Boolean(config.font_km) ||
    Boolean(config.font_en) ||
    (config.font_size && config.font_size !== "base") ||
    config.is_bold !== null ||
    config.is_italic !== null ||
    config.show_underline === false;

  const handleReset = () => {
    onChange({
      text_km: null,
      text_en: null,
      color: null,
      font_km: null,
      font_en: null,
      font_size: "base",
      is_bold: null,
      is_italic: null,
      show_underline: true,
    });
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-semibold tracking-wide">
              Cover Page Invitation Title (សូមគោរពអញ្ជើញ / INVITATION)
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the font family, color, size, bold, italic, and underline styling on the cover screen for both Khmer and English.
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
            Reset styling
          </Button>
        )}
      </div>

      {/* Live Preview Box */}
      <div className="rounded-lg p-3.5 bg-secondary/30 border border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Live Cover Title Preview
          </span>
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-md border border-border/60">
            <button
              type="button"
              onClick={() => setPreviewLang("km")}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                !isEn ? "bg-gold text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Khmer
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang("en")}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                isEn ? "bg-gold text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="p-5 rounded-md bg-[#fdf5dc] border border-[#d4af37]/30 text-center flex flex-col items-center justify-center min-h-[90px]">
          <p
            className={`transition-all ${isBold ? "font-bold" : (isEn ? "font-semibold" : "font-normal")} ${
              isItalic ? "italic" : ""
            } ${isUnderline ? "underline underline-offset-[6px] decoration-2" : ""} ${
              !resolvedFont ? (isEn ? "tracking-widest uppercase" : "font-khmer-koulen") : ""
            }`}
            style={{
              color: safeColor,
              fontFamily: resolvedFont,
              textDecorationColor: safeColor,
              fontSize: fontSizeStyle.fontSize,
              lineHeight: 1.4,
            }}
          >
            {activeText}
          </p>
          <span className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
            {isEn ? "Previewing English Cover Title" : "Previewing Khmer Cover Title"}
          </span>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khmer Custom Text */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <span>Khmer Title Text</span>
          </Label>
          <Input
            value={config.text_km ?? ""}
            onChange={(e) => onChange({ text_km: e.target.value || null })}
            placeholder="សូមគោរពអញ្ជើញ"
            className="text-sm font-khmer-siemreap"
          />
          <p className="text-[11px] text-muted-foreground">Default: សូមគោរពអញ្ជើញ</p>
        </div>

        {/* English Custom Text */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <span>English Title Text</span>
          </Label>
          <Input
            value={config.text_en ?? ""}
            onChange={(e) => onChange({ text_en: e.target.value || null })}
            placeholder="INVITATION"
            className="text-sm uppercase tracking-wider"
          />
          <p className="text-[11px] text-muted-foreground">Default: INVITATION</p>
        </div>

        {/* Khmer Font Family */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Khmer Font Family</span>
          </Label>
          <Select
            value={config.font_km || "default"}
            onValueChange={(val) => onChange({ font_km: val === "default" ? null : val })}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Default Khmer Font (Koulen / Moul)" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="default">Default Khmer Font (Koulen / Moul)</SelectItem>
              {HEADER_FONT_OPTIONS.filter((f) => f.category === "khmer").map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
              {BODY_FONT_OPTIONS.filter((f) => f.category === "khmer").map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* English Font Family */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            <span>English Font Family</span>
          </Label>
          <Select
            value={config.font_en || "default"}
            onValueChange={(val) => onChange({ font_en: val === "default" ? null : val })}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Default English Font (Cinzel / Sans)" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="default">Default English Font (Cinzel / Sans)</SelectItem>
              {HEADER_FONT_OPTIONS.filter((f) => f.category === "latin").map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
              {BODY_FONT_OPTIONS.filter((f) => f.category === "latin").map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Title &amp; Underline Colour</span>
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color && /^#[0-9a-fA-F]{3,6}$/.test(config.color.replace("#", "")) ? config.color : defaultAccentColor || "#1a1a1a"}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
              aria-label="Pick cover title color"
            />
            <Input
              value={config.color ?? ""}
              onChange={(e) => onChange({ color: e.target.value || null })}
              placeholder={defaultAccentColor || "#1a1a1a"}
              className="font-mono text-sm"
            />
            {config.color && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-xs"
                onClick={() => onChange({ color: null })}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Font Size</Label>
          <Select
            value={config.font_size || "base"}
            onValueChange={(val) => onChange({ font_size: val as CoverInvitationFontSize })}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Standard / Medium (Default)" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.enDesc})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formatting Toggles: Bold, Italic, Underline */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3">
        <Label className="text-xs font-medium mr-1 text-muted-foreground">Style Formatting:</Label>

        {/* Bold Toggle */}
        <Button
          type="button"
          size="sm"
          variant={isBold ? "default" : "outline"}
          className={`h-8 px-3 text-xs gap-1.5 ${isBold ? "bg-gold text-white hover:bg-gold/90" : ""}`}
          onClick={() => onChange({ is_bold: isBold ? false : true })}
        >
          <Bold className="h-3.5 w-3.5" />
          <span>Bold</span>
        </Button>

        {/* Italic Toggle */}
        <Button
          type="button"
          size="sm"
          variant={isItalic ? "default" : "outline"}
          className={`h-8 px-3 text-xs gap-1.5 ${isItalic ? "bg-gold text-white hover:bg-gold/90" : ""}`}
          onClick={() => onChange({ is_italic: !isItalic })}
        >
          <Italic className="h-3.5 w-3.5" />
          <span>Italic</span>
        </Button>

        {/* Underline Toggle */}
        <Button
          type="button"
          size="sm"
          variant={isUnderline ? "default" : "outline"}
          className={`h-8 px-3 text-xs gap-1.5 ${isUnderline ? "bg-gold text-white hover:bg-gold/90" : ""}`}
          onClick={() => onChange({ show_underline: !isUnderline })}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
          <span>Underline</span>
        </Button>
      </div>
    </div>
  );
}
