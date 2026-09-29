import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  getResolvedCoverTitleStyle,
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
  Type,
  Palette,
  Eye,
} from "lucide-react";

export type CoverInvitationStyleEditorProps = {
  config: CoverInvitationStyle;
  onChange: (patch: Partial<CoverInvitationStyle>) => void;
  defaultAccentColor?: string | null;
  className?: string;
};

const FONT_SIZE_OPTIONS: { value: CoverInvitationFontSize; label: string; kmDesc: string; enDesc: string }[] = [
  { value: "xs", label: "Extra Small (XS)", kmDesc: "0.9rem", enDesc: "0.75rem" },
  { value: "sm", label: "Small (SM)", kmDesc: "1.05rem", enDesc: "0.875rem" },
  { value: "base", label: "Standard / Medium (Default)", kmDesc: "1.25rem", enDesc: "1.0rem" },
  { value: "lg", label: "Large (LG)", kmDesc: "1.45rem", enDesc: "1.15rem" },
  { value: "xl", label: "Extra Large (XL)", kmDesc: "1.7rem", enDesc: "1.35rem" },
  { value: "2xl", label: "2X Large (2XL)", kmDesc: "2.0rem", enDesc: "1.6rem" },
  { value: "3xl", label: "3X Large (3XL)", kmDesc: "2.4rem", enDesc: "1.9rem" },
];

export default function CoverInvitationStyleEditor({
  config,
  onChange,
  defaultAccentColor = "#1a1a1a",
  className = "",
}: CoverInvitationStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<"km" | "en">("km");

  const safeDefaultAccent = defaultAccentColor || "#1a1a1a";

  const resolvedKm = getResolvedCoverTitleStyle(config, false, safeDefaultAccent);
  const resolvedEn = getResolvedCoverTitleStyle(config, true, safeDefaultAccent);

  const isCustomized =
    Boolean(config.text_km) ||
    Boolean(config.text_en) ||
    Boolean(config.color_km) ||
    Boolean(config.color_en) ||
    Boolean(config.color) ||
    Boolean(config.font_km) ||
    Boolean(config.font_en) ||
    (config.font_size_km && config.font_size_km !== "base") ||
    (config.font_size_en && config.font_size_en !== "base") ||
    config.is_bold_km !== null ||
    config.is_bold_en !== null ||
    config.is_italic_km !== null ||
    config.is_italic_en !== null ||
    config.show_underline_km === false ||
    config.show_underline_en === false;

  const handleResetKm = () => {
    onChange({
      text_km: null,
      color_km: null,
      font_km: null,
      font_size_km: "base",
      is_bold_km: null,
      is_italic_km: null,
      show_underline_km: true,
    });
  };

  const handleResetEn = () => {
    onChange({
      text_en: null,
      color_en: null,
      font_en: null,
      font_size_en: "base",
      is_bold_en: null,
      is_italic_en: null,
      show_underline_en: true,
    });
  };

  const handleResetAll = () => {
    onChange({
      text_km: null,
      color_km: null,
      font_km: null,
      font_size_km: "base",
      is_bold_km: null,
      is_italic_km: null,
      show_underline_km: true,

      text_en: null,
      color_en: null,
      font_en: null,
      font_size_en: "base",
      is_bold_en: null,
      is_italic_en: null,
      show_underline_en: true,

      color: null,
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
            Configure separate, independent font types, colors, sizes, and styling (bold/italic/underline) for the Khmer and English cover screens.
          </p>
        </div>

        {isCustomized && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleResetAll}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset all cover styles
          </Button>
        )}
      </div>

      {/* Language Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-10">
          <TabsTrigger value="km" className="text-xs font-medium flex items-center justify-center gap-2">
            <span className="text-base">🇰🇭</span>
            <span>Khmer Title Style (សូមគោរពអញ្ជើញ)</span>
          </TabsTrigger>
          <TabsTrigger value="en" className="text-xs font-medium flex items-center justify-center gap-2">
            <span className="text-base">🇬🇧</span>
            <span>English Title Style (INVITATION)</span>
          </TabsTrigger>
        </TabsList>

        {/* 🇰🇭 KHMER TAB */}
        <TabsContent value="km" className="space-y-4 pt-3">
          {/* Khmer Live Preview */}
          <div className="rounded-lg p-3.5 bg-secondary/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gold" />
                <span>Khmer Cover Title Live Preview</span>
              </span>
              {(config.text_km || config.color_km || config.font_km || (config.font_size_km && config.font_size_km !== "base") || config.is_bold_km !== null || config.is_italic_km !== null || config.show_underline_km === false) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={handleResetKm}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset Khmer Style
                </Button>
              )}
            </div>

            <div className="p-5 rounded-md bg-[#fdf5dc] border border-[#d4af37]/30 text-center flex flex-col items-center justify-center min-h-[95px]">
              <p
                className={`transition-all ${resolvedKm.isBold ? "font-bold" : "font-normal"} ${
                  resolvedKm.isItalic ? "italic" : ""
                } ${resolvedKm.showUnderline ? "underline underline-offset-[6px] decoration-2" : ""} ${
                  !resolvedKm.font ? "font-khmer-koulen" : ""
                }`}
                style={{
                  color: resolvedKm.color,
                  fontFamily: resolvedKm.font,
                  textDecorationColor: resolvedKm.color,
                  fontSize: resolvedKm.fontSize.fontSize,
                  lineHeight: 1.4,
                }}
              >
                {resolvedKm.text}
              </p>
              <span className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
                Font: {config.font_km || "Default (Koulen)"} • Color: {resolvedKm.color} • Size: {config.font_size_km || "base"}
              </span>
            </div>
          </div>

          {/* Khmer Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Khmer Text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Khmer Title Text</Label>
              <Input
                value={config.text_km ?? ""}
                onChange={(e) => onChange({ text_km: e.target.value || null })}
                placeholder="សូមគោរពអញ្ជើញ"
                className="text-sm font-khmer-siemreap"
              />
              <p className="text-[11px] text-muted-foreground">Default: សូមគោរពអញ្ជើញ</p>
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

            {/* Khmer Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Khmer Title &amp; Underline Colour</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.color_km && /^#[0-9a-fA-F]{3,6}$/.test(config.color_km.replace("#", "")) ? config.color_km : safeDefaultAccent}
                  onChange={(e) => onChange({ color_km: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                  aria-label="Pick Khmer cover title color"
                />
                <Input
                  value={config.color_km ?? ""}
                  onChange={(e) => onChange({ color_km: e.target.value || null })}
                  placeholder={safeDefaultAccent}
                  className="font-mono text-sm"
                />
                {config.color_km && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-xs"
                    onClick={() => onChange({ color_km: null })}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Khmer Font Size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Khmer Font Size</Label>
              <Select
                value={config.font_size_km || "base"}
                onValueChange={(val) => onChange({ font_size_km: val as CoverInvitationFontSize })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Standard / Medium (Default)" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.kmDesc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Khmer Formatting Toggles */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3">
            <Label className="text-xs font-medium mr-1 text-muted-foreground">Khmer Style Formatting:</Label>

            <Button
              type="button"
              size="sm"
              variant={resolvedKm.isBold ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedKm.isBold ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ is_bold_km: !resolvedKm.isBold })}
            >
              <Bold className="h-3.5 w-3.5" />
              <span>Bold</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={resolvedKm.isItalic ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedKm.isItalic ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ is_italic_km: !resolvedKm.isItalic })}
            >
              <Italic className="h-3.5 w-3.5" />
              <span>Italic</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={resolvedKm.showUnderline ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedKm.showUnderline ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ show_underline_km: !resolvedKm.showUnderline })}
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
              <span>Underline</span>
            </Button>
          </div>
        </TabsContent>

        {/* 🇬🇧 ENGLISH TAB */}
        <TabsContent value="en" className="space-y-4 pt-3">
          {/* English Live Preview */}
          <div className="rounded-lg p-3.5 bg-secondary/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gold" />
                <span>English Cover Title Live Preview</span>
              </span>
              {(config.text_en || config.color_en || config.font_en || (config.font_size_en && config.font_size_en !== "base") || config.is_bold_en !== null || config.is_italic_en !== null || config.show_underline_en === false) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={handleResetEn}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset English Style
                </Button>
              )}
            </div>

            <div className="p-5 rounded-md bg-[#fdf5dc] border border-[#d4af37]/30 text-center flex flex-col items-center justify-center min-h-[95px]">
              <p
                className={`transition-all ${resolvedEn.isBold ? "font-bold" : "font-normal"} ${
                  resolvedEn.isItalic ? "italic" : ""
                } ${resolvedEn.showUnderline ? "underline underline-offset-[6px] decoration-2" : ""} ${
                  !resolvedEn.font ? "tracking-widest uppercase font-semibold" : ""
                }`}
                style={{
                  color: resolvedEn.color,
                  fontFamily: resolvedEn.font,
                  textDecorationColor: resolvedEn.color,
                  fontSize: resolvedEn.fontSize.fontSize,
                  lineHeight: 1.4,
                }}
              >
                {resolvedEn.text}
              </p>
              <span className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
                Font: {config.font_en || "Default (Cinzel/Sans)"} • Color: {resolvedEn.color} • Size: {config.font_size_en || "base"}
              </span>
            </div>
          </div>

          {/* English Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom English Text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">English Title Text</Label>
              <Input
                value={config.text_en ?? ""}
                onChange={(e) => onChange({ text_en: e.target.value || null })}
                placeholder="INVITATION"
                className="text-sm uppercase tracking-wider"
              />
              <p className="text-[11px] text-muted-foreground">Default: INVITATION</p>
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

            {/* English Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span>English Title &amp; Underline Colour</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.color_en && /^#[0-9a-fA-F]{3,6}$/.test(config.color_en.replace("#", "")) ? config.color_en : safeDefaultAccent}
                  onChange={(e) => onChange({ color_en: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                  aria-label="Pick English cover title color"
                />
                <Input
                  value={config.color_en ?? ""}
                  onChange={(e) => onChange({ color_en: e.target.value || null })}
                  placeholder={safeDefaultAccent}
                  className="font-mono text-sm"
                />
                {config.color_en && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-xs"
                    onClick={() => onChange({ color_en: null })}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* English Font Size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">English Font Size</Label>
              <Select
                value={config.font_size_en || "base"}
                onValueChange={(val) => onChange({ font_size_en: val as CoverInvitationFontSize })}
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

          {/* English Formatting Toggles */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-3">
            <Label className="text-xs font-medium mr-1 text-muted-foreground">English Style Formatting:</Label>

            <Button
              type="button"
              size="sm"
              variant={resolvedEn.isBold ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedEn.isBold ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ is_bold_en: !resolvedEn.isBold })}
            >
              <Bold className="h-3.5 w-3.5" />
              <span>Bold</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={resolvedEn.isItalic ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedEn.isItalic ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ is_italic_en: !resolvedEn.isItalic })}
            >
              <Italic className="h-3.5 w-3.5" />
              <span>Italic</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={resolvedEn.showUnderline ? "default" : "outline"}
              className={`h-8 px-3 text-xs gap-1.5 ${resolvedEn.showUnderline ? "bg-gold text-white hover:bg-gold/90" : ""}`}
              onClick={() => onChange({ show_underline_en: !resolvedEn.showUnderline })}
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
              <span>Underline</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
