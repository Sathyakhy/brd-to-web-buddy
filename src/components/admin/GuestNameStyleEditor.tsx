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
  GuestNameStyle,
  GuestNameFontSize,
  GUEST_NAME_FONT_SIZE_OPTIONS,
  getResolvedGuestNameStyle,
} from "@/lib/guestNameStyle";
import {
  Sparkles,
  RotateCcw,
  Bold,
  Italic,
  Type,
  Palette,
  Eye,
  User,
} from "lucide-react";

export type GuestNameStyleEditorProps = {
  config: GuestNameStyle;
  onChange: (patch: Partial<GuestNameStyle>) => void;
  defaultAccentColor?: string | null;
  className?: string;
  sampleGuestNameKm?: string;
  sampleGuestNameEn?: string;
};

const KHMER_GUEST_FONTS = [
  { value: "Khmer OS Moul Light", label: "Khmer OS Moul Light (Classic Royal)" },
  { value: "Khmer OS Moul", label: "Khmer OS Moul (Bold Traditional)" },
  { value: "Moul", label: "Moul (Google Fonts)" },
  { value: "Moulpali", label: "Moulpali (Rounded Elegant)" },
  { value: "Koulen", label: "Koulen (Modern Headline)" },
  { value: "Siemreap", label: "Siemreap (Clean Book)" },
  { value: "Battambang", label: "Battambang (Crisp Legible)" },
  { value: "Bokor", label: "Bokor (Antique Ornate)" },
  { value: "Angkor", label: "Angkor (Monumental Stone)" },
  { value: "Bayon", label: "Bayon (Regal Angular)" },
  { value: "Preahvihear", label: "Preahvihear (Graceful Tall)" },
  { value: "Noto Serif Khmer", label: "Noto Serif Khmer (Formal Serif)" },
];

const ENGLISH_GUEST_FONTS = [
  { value: "Bitter", label: "Bitter (Slab Serif — Default)" },
  { value: "Playfair Display", label: "Playfair Display (Luxury Editorial)" },
  { value: "Cinzel", label: "Cinzel (Royal Roman Caps)" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Graceful Serif)" },
  { value: "Great Vibes", label: "Great Vibes (Calligraphy Script)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Modern Geometric)" },
  { value: "Inter", label: "Inter (Crisp Neutral)" },
  { value: "Space Grotesk", label: "Space Grotesk (Contemporary Clean)" },
];

const PRESET_COLORS = [
  { name: "Traditional Gold", value: "#f7a60f" },
  { name: "Rich Gold", value: "#d4a93a" },
  { name: "Champagne Gold", value: "#f5d76e" },
  { name: "Amber Ochre", value: "#c69214" },
  { name: "Warm Bronze", value: "#3a1a05" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Warm Ivory", value: "#faf6ed" },
  { name: "Deep Charcoal", value: "#1a1a1a" },
];

export default function GuestNameStyleEditor({
  config,
  onChange,
  defaultAccentColor = "#f7a60f",
  className = "",
  sampleGuestNameKm = "ឯកឧត្តម និងលោកជំទាវ",
  sampleGuestNameEn = "Mr. & Mrs. John Smith",
}: GuestNameStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<"km" | "en">("km");

  const safeDefaultAccent = defaultAccentColor || "#f7a60f";

  const resolvedKm = getResolvedGuestNameStyle(config, false, safeDefaultAccent);
  const resolvedEn = getResolvedGuestNameStyle(config, true, safeDefaultAccent);

  const isCustomized =
    Boolean(config.font_km) ||
    Boolean(config.font_en) ||
    Boolean(config.color_km && config.color_km !== "#f7a60f") ||
    Boolean(config.color_en && config.color_en !== "#f7a60f") ||
    (config.font_size_km && config.font_size_km !== "base") ||
    (config.font_size_en && config.font_size_en !== "base") ||
    config.is_bold_km !== null ||
    config.is_bold_en === false ||
    config.is_italic_km !== null ||
    config.is_italic_en !== null;

  const handleResetKm = () => {
    onChange({
      font_km: null,
      font_size_km: "base",
      color_km: "#f7a60f",
      is_bold_km: null,
      is_italic_km: null,
    });
  };

  const handleResetEn = () => {
    onChange({
      font_en: null,
      font_size_en: "base",
      color_en: "#f7a60f",
      is_bold_en: true,
      is_italic_en: null,
    });
  };

  const handleResetAll = () => {
    onChange({
      font_km: null,
      font_size_km: "base",
      color_km: "#f7a60f",
      is_bold_km: null,
      is_italic_km: null,

      font_en: null,
      font_size_en: "base",
      color_en: "#f7a60f",
      is_bold_en: true,
      is_italic_en: null,

      color: null,
      font_size: "base",
      is_bold: null,
      is_italic: null,
    });
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-gold/10 text-gold">
              <User className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-semibold tracking-wide">
              Cover Guest Name Styling (Khmer & English)
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure independent font family, size, and color for guest names on the cover screen for both Khmer and English.
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
            Reset all guest styles
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "km" | "en")}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <TabsList className="grid grid-cols-2 w-full max-w-[280px]">
            <TabsTrigger value="km" className="text-xs font-khmer-siemreap flex items-center gap-1.5">
              <span>🇰🇭</span>
              <span>Khmer Guest Name</span>
            </TabsTrigger>
            <TabsTrigger value="en" className="text-xs flex items-center gap-1.5">
              <span>🇬🇧</span>
              <span>English Guest Name</span>
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-8"
            onClick={activeTab === "km" ? handleResetKm : handleResetEn}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset {activeTab === "km" ? "Khmer" : "English"}
          </Button>
        </div>

        {/* Live Preview Card */}
        <div className="rounded-lg border border-border/70 bg-gradient-to-br from-amber-950/20 via-black/40 to-neutral-950 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden my-3">
          <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            <span>Live Guest Name Preview ({activeTab === "km" ? "Khmer" : "English"})</span>
          </div>

          <div className="mt-5 mb-2 w-full max-w-[380px] min-h-[76px] flex items-center justify-center px-6 py-2.5 relative">
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none opacity-90"
              style={{ backgroundImage: "url('/templates/khmer-traditional/name-plate.webp')" }}
            />
            <span
              className="relative z-10 whitespace-nowrap truncate max-w-full"
              style={{
                fontFamily: activeTab === "km" ? resolvedKm.font : resolvedEn.font,
                fontSize: activeTab === "km" ? (resolvedKm.fontSize.fontSize || "1.7rem") : (resolvedEn.fontSize.fontSize || "1.45rem"),
                color: activeTab === "km" ? resolvedKm.color : resolvedEn.color,
                fontWeight: (activeTab === "km" ? resolvedKm.isBold : resolvedEn.isBold) ? "bold" : "normal",
                fontStyle: (activeTab === "km" ? resolvedKm.isItalic : resolvedEn.isItalic) ? "italic" : "normal",
                textShadow: "0 2px 5px rgba(0,0,0,0.5)",
                display: "inline-block",
              }}
            >
              {activeTab === "km" ? sampleGuestNameKm : sampleGuestNameEn}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Simulated on the gold cover nameplate
          </span>
        </div>

        {/* KHMER TAB CONTENT */}
        <TabsContent value="km" className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-gold" />
                <span>Khmer Font Type (ពុម្ពអក្សរ)</span>
              </Label>
              <Select
                value={config.font_km || "Khmer OS Moul Light"}
                onValueChange={(val) => onChange({ font_km: val === "Khmer OS Moul Light" ? null : val })}
              >
                <SelectTrigger className="h-9 text-xs font-khmer-siemreap">
                  <SelectValue placeholder="Select Khmer Font" />
                </SelectTrigger>
                <SelectContent>
                  {KHMER_GUEST_FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-xs">
                      <span style={{ fontFamily: `"${font.value}", serif` }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>Khmer Font Size (ទំហំអក្សរ)</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {GUEST_NAME_FONT_SIZE_OPTIONS.find((s) => s.value === (config.font_size_km || "base"))?.kmDesc || "1.85rem"}
                </span>
              </Label>
              <Select
                value={typeof config.font_size_km === "string" ? config.font_size_km : "base"}
                onValueChange={(val) => onChange({ font_size_km: val as GuestNameFontSize })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Standard / Medium (Default)" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_NAME_FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label} ({opt.kmDesc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color & Style Options */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-gold" />
              <span>Khmer Font Color (ពណ៌អក្សរ)</span>
            </Label>

            {/* Color Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = (config.color_km || "#f7a60f").toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onChange({ color_km: c.value })}
                    className={`h-7 px-2.5 rounded-full border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "border-gold ring-2 ring-gold/40 shadow-sm"
                        : "border-border/60 hover:border-border bg-card/60"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.value }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex + Color Picker + Styling Toggles */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 max-w-[200px]">
                <input
                  type="color"
                  value={config.color_km && config.color_km.startsWith("#") ? config.color_km : "#f7a60f"}
                  onChange={(e) => onChange({ color_km: e.target.value })}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-background shrink-0"
                  title="Pick custom color"
                />
                <Input
                  className="h-8 text-xs font-mono"
                  placeholder="#f7a60f"
                  value={config.color_km ?? "#f7a60f"}
                  onChange={(e) => onChange({ color_km: e.target.value })}
                />
              </div>

              {/* Bold & Italic Toggles */}
              <div className="flex items-center gap-1 border border-border/70 rounded-md p-0.5 bg-muted/20">
                <Button
                  type="button"
                  variant={config.is_bold_km ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 w-7 p-0 ${config.is_bold_km ? "bg-gold text-primary-foreground hover:bg-gold/90" : "text-muted-foreground"}`}
                  onClick={() => onChange({ is_bold_km: !config.is_bold_km })}
                  title="Bold font"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={config.is_italic_km ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 w-7 p-0 ${config.is_italic_km ? "bg-gold text-primary-foreground hover:bg-gold/90" : "text-muted-foreground"}`}
                  onClick={() => onChange({ is_italic_km: !config.is_italic_km })}
                  title="Italic font"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ENGLISH TAB CONTENT */}
        <TabsContent value="en" className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-gold" />
                <span>English Font Type</span>
              </Label>
              <Select
                value={config.font_en || "Bitter"}
                onValueChange={(val) => onChange({ font_en: val === "Bitter" ? null : val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select English Font" />
                </SelectTrigger>
                <SelectContent>
                  {ENGLISH_GUEST_FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value} className="text-xs">
                      <span style={{ fontFamily: `"${font.value}", serif` }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>English Font Size</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {GUEST_NAME_FONT_SIZE_OPTIONS.find((s) => s.value === (config.font_size_en || "base"))?.enDesc || "1.55rem"}
                </span>
              </Label>
              <Select
                value={typeof config.font_size_en === "string" ? config.font_size_en : "base"}
                onValueChange={(val) => onChange({ font_size_en: val as GuestNameFontSize })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Standard / Medium (Default)" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_NAME_FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label} ({opt.enDesc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color & Style Options */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-gold" />
              <span>English Font Color</span>
            </Label>

            {/* Color Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = (config.color_en || "#f7a60f").toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onChange({ color_en: c.value })}
                    className={`h-7 px-2.5 rounded-full border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "border-gold ring-2 ring-gold/40 shadow-sm"
                        : "border-border/60 hover:border-border bg-card/60"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.value }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex + Color Picker + Styling Toggles */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 max-w-[200px]">
                <input
                  type="color"
                  value={config.color_en && config.color_en.startsWith("#") ? config.color_en : "#f7a60f"}
                  onChange={(e) => onChange({ color_en: e.target.value })}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-background shrink-0"
                  title="Pick custom color"
                />
                <Input
                  className="h-8 text-xs font-mono"
                  placeholder="#f7a60f"
                  value={config.color_en ?? "#f7a60f"}
                  onChange={(e) => onChange({ color_en: e.target.value })}
                />
              </div>

              {/* Bold & Italic Toggles */}
              <div className="flex items-center gap-1 border border-border/70 rounded-md p-0.5 bg-muted/20">
                <Button
                  type="button"
                  variant={config.is_bold_en !== false ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 w-7 p-0 ${config.is_bold_en !== false ? "bg-gold text-primary-foreground hover:bg-gold/90" : "text-muted-foreground"}`}
                  onClick={() => onChange({ is_bold_en: config.is_bold_en === false ? true : false })}
                  title="Bold font"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={config.is_italic_en ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 w-7 p-0 ${config.is_italic_en ? "bg-gold text-primary-foreground hover:bg-gold/90" : "text-muted-foreground"}`}
                  onClick={() => onChange({ is_italic_en: !config.is_italic_en })}
                  title="Italic font"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
