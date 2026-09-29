import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RsvpStyleConfig,
  RsvpCardShadowType,
  RsvpHeaderEffectType,
  RSVP_CARD_SHADOW_PRESETS,
  RSVP_HEADER_EFFECT_PRESETS,
  computeRsvpCardShadow,
  computeRsvpHeaderShadow,
} from "@/lib/rsvpStyle";
import { hexWithOpacity } from "@/components/admin/ElementStyleEditor";
import {
  HEADER_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
  resolveHeaderFont,
  resolveBodyFont,
} from "@/lib/fonts";
import {
  Sparkles,
  RotateCcw,
  Sliders,
  Type as TypeIcon,
  Sun,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type RsvpCardStyleEditorProps = {
  config: RsvpStyleConfig;
  onChange: (patch: Partial<RsvpStyleConfig>) => void;
  accentColor?: string | null;
  primaryColor?: string | null;
  globalHeaderFont?: string | null;
  globalBodyFont?: string | null;
  isDualLanguage?: boolean;
};

export default function RsvpCardStyleEditor({
  config,
  onChange,
  accentColor = "#db9b0f",
  primaryColor = "#3a2a00",
  globalHeaderFont,
  globalBodyFont,
  isDualLanguage = false,
}: RsvpCardStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "shadow" | "header_effect" | "fonts">("appearance");
  const [showAdvancedShadow, setShowAdvancedShadow] = useState(false);
  const [showAdvancedHeader, setShowAdvancedHeader] = useState(false);

  const safeAccent = accentColor || "#db9b0f";
  const safePrimary = primaryColor || "#3a2a00";

  // Card background
  const bgColor = config.bg_color || "#ffffff";
  const bgOpacity = typeof config.bg_opacity === "number" ? config.bg_opacity : 25;
  const resolvedBg = hexWithOpacity(bgColor, bgOpacity);

  // Card shadow
  const shadowType = (config.card_shadow_type as RsvpCardShadowType) || "default";
  const previewCardShadow = computeRsvpCardShadow(config, safeAccent);

  // Header text shadow / glow
  const headerEffectType = (config.header_effect as RsvpHeaderEffectType) || "default";
  const previewHeaderShadow = computeRsvpHeaderShadow(config, safeAccent);

  // Fonts
  const headerFontKm = config.header_font || null;
  const headerFontEn = config.header_font_en || null;
  const bodyFontKm = config.body_font || null;
  const bodyFontEn = config.body_font_en || null;

  const resolvedHeaderFontFamily = headerFontKm
    ? resolveHeaderFont(headerFontKm, false)
    : globalHeaderFont
    ? resolveHeaderFont(globalHeaderFont, false)
    : undefined;

  const resolvedBodyFontFamily = bodyFontKm
    ? resolveBodyFont(bodyFontKm, false)
    : globalBodyFont
    ? resolveBodyFont(globalBodyFont, false)
    : undefined;

  const isCustomized =
    Boolean(config.bg_color) ||
    typeof config.bg_opacity === "number" ||
    (Boolean(config.card_shadow_type) && config.card_shadow_type !== "default") ||
    (Boolean(config.header_effect) && config.header_effect !== "default") ||
    Boolean(config.header_font) ||
    Boolean(config.header_font_en) ||
    Boolean(config.body_font) ||
    Boolean(config.body_font_en);

  const handleResetAll = () => {
    onChange({
      bg_color: null,
      bg_opacity: null,
      card_shadow_type: "default",
      card_shadow_color: null,
      card_shadow_blur: null,
      card_shadow_spread: null,
      card_shadow_x: null,
      card_shadow_y: null,
      card_shadow_opacity: null,
      header_effect: "default",
      header_effect_color: null,
      header_effect_blur: null,
      header_effect_x: null,
      header_effect_y: null,
      header_effect_opacity: null,
      header_font: null,
      header_font_en: null,
      body_font: null,
      body_font_en: null,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-semibold tracking-wide">RSVP Card Visual Styling</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure fonts, card shadow & glow, header effects, and background tint for the RSVP section card.
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
            Reset all styling
          </Button>
        )}
      </div>

      {/* Live Preview Card */}
      <div className="rounded-lg p-3 bg-secondary/30 border border-border/50 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          <span>Live RSVP Card Preview</span>
          <span className="text-gold font-mono text-[10px]">
            {shadowType} shadow • {headerEffectType} header
          </span>
        </div>

        <div
          className="rounded-2xl p-5 text-center transition-all duration-200 mx-auto max-w-md relative overflow-hidden"
          style={{
            borderColor: safeAccent,
            borderWidth: 2,
            borderStyle: "solid",
            background: resolvedBg,
            boxShadow: previewCardShadow,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5 opacity-80">
            <span className="h-px w-6" style={{ background: safeAccent }} />
            <Sparkles className="h-3.5 w-3.5" style={{ color: safeAccent }} />
            <span className="h-px w-6" style={{ background: safeAccent }} />
          </div>

          <p
            className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-1"
            style={{
              color: safeAccent,
              fontFamily: resolvedHeaderFontFamily,
            }}
          >
            R · S · V · P
          </p>

          <h5
            className="text-base sm:text-lg font-bold leading-snug px-2 mb-2"
            style={{
              color: safeAccent,
              fontFamily: resolvedHeaderFontFamily,
              textShadow: previewHeaderShadow,
            }}
          >
            {config.rsvp_title?.trim() || "តើលោកអ្នកនឹងអញ្ជើញមកចូលរួមដែរឬទេ?"}
          </h5>

          <p
            className="text-xs leading-relaxed opacity-90 max-w-xs mx-auto"
            style={{
              color: safePrimary,
              fontFamily: resolvedBodyFontFamily,
            }}
          >
            វត្តមានដ៏ឧត្តុង្គឧត្តមរបស់លោកអ្នក ជាកិត្តិយសដ៏ធំធេងសម្រាប់យើងខ្ញុំ
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className="text-[11px] px-3 py-1 rounded-full font-medium"
              style={{
                background: "rgba(34,197,94,0.15)",
                color: "#16a34a",
                border: "1px solid rgba(34,197,94,0.3)",
                fontFamily: resolvedBodyFontFamily,
              }}
            >
              ✓ នឹងចូលរួម
            </span>
            <span
              className="text-[11px] px-3 py-1 rounded-full font-medium"
              style={{
                background: `${safeAccent}1f`,
                color: safeAccent,
                border: `1px solid ${safeAccent}40`,
                fontFamily: resolvedBodyFontFamily,
              }}
            >
              ឆ្លើយតប
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full h-9">
          <TabsTrigger value="appearance" className="text-xs flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Card Background</span>
          </TabsTrigger>
          <TabsTrigger value="shadow" className="text-xs flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5" />
            <span>Card Shadow</span>
          </TabsTrigger>
          <TabsTrigger value="header_effect" className="text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Header Effect</span>
          </TabsTrigger>
          <TabsTrigger value="fonts" className="text-xs flex items-center gap-1.5">
            <TypeIcon className="h-3.5 w-3.5" />
            <span>Fonts</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Background & Title Tab */}
        <TabsContent value="appearance" className="space-y-4 pt-3">
          {/* Card Title / Question */}
          <div className="rounded-lg border border-border p-3.5 space-y-3 bg-secondary/10">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                RSVP Question / Title
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize the main question or header displayed on the RSVP card. Leave blank for default.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Khmer title / question</Label>
                <Input
                  value={config.rsvp_title ?? ""}
                  onChange={(e) => onChange({ rsvp_title: e.target.value || null })}
                  placeholder="តើលោកអ្នកនឹងអញ្ជើញមកចូលរួមដែរឬទេ?"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">English title / question</Label>
                <Input
                  value={config.rsvp_title_en ?? ""}
                  onChange={(e) => onChange({ rsvp_title_en: e.target.value || null })}
                  placeholder="Will you be attending our wedding celebration?"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3.5 space-y-3 bg-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Card Background Color & Opacity
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set the background tint and glass opacity for the RSVP container.
                </p>
              </div>
              {(config.bg_color || typeof config.bg_opacity === "number") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onChange({ bg_color: null, bg_opacity: null })}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-3 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor && /^#[0-9a-fA-F]{3,6}$/.test(bgColor.replace("#", "")) ? bgColor : "#ffffff"}
                  onChange={(e) => onChange({ bg_color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                  aria-label="Pick RSVP background color"
                />
                <Input
                  value={config.bg_color ?? ""}
                  onChange={(e) => onChange({ bg_color: e.target.value || null })}
                  placeholder="#ffffff"
                  className="w-32 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{bgOpacity}%</span>
                </div>
                <Slider
                  value={[bgOpacity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => onChange({ bg_opacity: v[0] ?? 25 })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Card Shadow Tab */}
        <TabsContent value="shadow" className="space-y-4 pt-3">
          <div className="rounded-lg border border-border p-3.5 space-y-4 bg-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Card Shadow & Glow Style
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose an elevation preset or customize color, blur, spread, and depth.
                </p>
              </div>
              {config.card_shadow_type && config.card_shadow_type !== "default" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    onChange({
                      card_shadow_type: "default",
                      card_shadow_color: null,
                      card_shadow_blur: null,
                      card_shadow_spread: null,
                      card_shadow_x: null,
                      card_shadow_y: null,
                      card_shadow_opacity: null,
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {RSVP_CARD_SHADOW_PRESETS.map((p) => {
                const isSelected = shadowType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        card_shadow_type: p.id,
                        ...(p.id === "custom" && !config.card_shadow_color
                          ? { card_shadow_color: safeAccent, card_shadow_blur: 16, card_shadow_opacity: 35 }
                          : {}),
                      });
                      if (p.id === "custom") setShowAdvancedShadow(true);
                    }}
                    className={`text-left p-2.5 rounded-lg border transition-all text-xs space-y-1 ${
                      isSelected
                        ? "border-gold bg-gold/10 text-foreground ring-1 ring-gold/40"
                        : "border-border/80 bg-background/60 hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                    </div>
                    <p className="text-[11px] leading-snug line-clamp-2 opacity-85">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune toggle */}
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground flex items-center gap-1"
                onClick={() => setShowAdvancedShadow(!showAdvancedShadow)}
              >
                <Sliders className="h-3 w-3" />
                <span>Fine-tune shadow parameters</span>
                {showAdvancedShadow ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
              </Button>
            </div>

            {/* Advanced Shadow Controls */}
            {showAdvancedShadow && (
              <div className="rounded-lg border border-border/80 bg-background/80 p-3 space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Shadow Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          config.card_shadow_color && /^#[0-9a-fA-F]{3,6}$/.test(config.card_shadow_color.replace("#", ""))
                            ? config.card_shadow_color
                            : safeAccent
                        }
                        onChange={(e) =>
                          onChange({
                            card_shadow_type: "custom",
                            card_shadow_color: e.target.value,
                          })
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-input p-1"
                      />
                      <Input
                        value={config.card_shadow_color ?? ""}
                        placeholder={safeAccent}
                        onChange={(e) =>
                          onChange({
                            card_shadow_type: "custom",
                            card_shadow_color: e.target.value || null,
                          })
                        }
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Shadow Opacity</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.card_shadow_opacity ?? 30}%
                      </span>
                    </div>
                    <Slider
                      value={[config.card_shadow_opacity ?? 30]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ card_shadow_type: "custom", card_shadow_opacity: v[0] ?? 30 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Blur Radius</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.card_shadow_blur ?? 12}px
                      </span>
                    </div>
                    <Slider
                      value={[config.card_shadow_blur ?? 12]}
                      min={0}
                      max={50}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ card_shadow_type: "custom", card_shadow_blur: v[0] ?? 12 })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Spread Radius</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.card_shadow_spread ?? 0}px
                      </span>
                    </div>
                    <Slider
                      value={[config.card_shadow_spread ?? 0]}
                      min={-10}
                      max={30}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ card_shadow_type: "custom", card_shadow_spread: v[0] ?? 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Horizontal Offset (X)</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.card_shadow_x ?? 0}px
                      </span>
                    </div>
                    <Slider
                      value={[config.card_shadow_x ?? 0]}
                      min={-20}
                      max={20}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ card_shadow_type: "custom", card_shadow_x: v[0] ?? 0 })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Vertical Offset (Y)</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.card_shadow_y ?? 0}px
                      </span>
                    </div>
                    <Slider
                      value={[config.card_shadow_y ?? 0]}
                      min={-10}
                      max={40}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ card_shadow_type: "custom", card_shadow_y: v[0] ?? 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. Header Text Effect Tab */}
        <TabsContent value="header_effect" className="space-y-4 pt-3">
          <div className="rounded-lg border border-border p-3.5 space-y-4 bg-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Header Text Effect & Glow
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applies shimmer, white rim, drop shadow, or custom glow to the RSVP question and title.
                </p>
              </div>
              {config.header_effect && config.header_effect !== "default" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    onChange({
                      header_effect: "default",
                      header_effect_color: null,
                      header_effect_blur: null,
                      header_effect_x: null,
                      header_effect_y: null,
                      header_effect_opacity: null,
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Header Effect Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {RSVP_HEADER_EFFECT_PRESETS.map((p) => {
                const isSelected = headerEffectType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        header_effect: p.id,
                        ...(p.id === "custom" && !config.header_effect_color
                          ? { header_effect_color: "#ffffff", header_effect_blur: 6, header_effect_opacity: 85 }
                          : {}),
                      });
                      if (p.id === "custom") setShowAdvancedHeader(true);
                    }}
                    className={`text-left p-2.5 rounded-lg border transition-all text-xs space-y-1 ${
                      isSelected
                        ? "border-gold bg-gold/10 text-foreground ring-1 ring-gold/40"
                        : "border-border/80 bg-background/60 hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                    </div>
                    <p className="text-[11px] leading-snug line-clamp-2 opacity-85">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune toggle */}
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground flex items-center gap-1"
                onClick={() => setShowAdvancedHeader(!showAdvancedHeader)}
              >
                <Sliders className="h-3 w-3" />
                <span>Fine-tune header text shadow</span>
                {showAdvancedHeader ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
              </Button>
            </div>

            {/* Advanced Header Shadow Controls */}
            {showAdvancedHeader && (
              <div className="rounded-lg border border-border/80 bg-background/80 p-3 space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Glow / Shadow Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          config.header_effect_color && /^#[0-9a-fA-F]{3,6}$/.test(config.header_effect_color.replace("#", ""))
                            ? config.header_effect_color
                            : "#ffffff"
                        }
                        onChange={(e) =>
                          onChange({
                            header_effect: "custom",
                            header_effect_color: e.target.value,
                          })
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-input p-1"
                      />
                      <Input
                        value={config.header_effect_color ?? ""}
                        placeholder="#ffffff"
                        onChange={(e) =>
                          onChange({
                            header_effect: "custom",
                            header_effect_color: e.target.value || null,
                          })
                        }
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Opacity</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.header_effect_opacity ?? 85}%
                      </span>
                    </div>
                    <Slider
                      value={[config.header_effect_opacity ?? 85]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ header_effect: "custom", header_effect_opacity: v[0] ?? 85 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Blur Radius</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.header_effect_blur ?? 6}px
                      </span>
                    </div>
                    <Slider
                      value={[config.header_effect_blur ?? 6]}
                      min={0}
                      max={30}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ header_effect: "custom", header_effect_blur: v[0] ?? 6 })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Offset X</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.header_effect_x ?? 0}px
                      </span>
                    </div>
                    <Slider
                      value={[config.header_effect_x ?? 0]}
                      min={-15}
                      max={15}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ header_effect: "custom", header_effect_x: v[0] ?? 0 })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Offset Y</span>
                      <span className="tabular-nums font-mono text-muted-foreground">
                        {config.header_effect_y ?? 0}px
                      </span>
                    </div>
                    <Slider
                      value={[config.header_effect_y ?? 0]}
                      min={-15}
                      max={15}
                      step={1}
                      onValueChange={(v) =>
                        onChange({ header_effect: "custom", header_effect_y: v[0] ?? 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 4. Fonts Tab */}
        <TabsContent value="fonts" className="space-y-4 pt-3">
          <div className="rounded-lg border border-border p-3.5 space-y-4 bg-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  RSVP Card Fonts & Typography
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize the specific fonts used inside the RSVP card, or leave empty to inherit the event's global fonts.
                </p>
              </div>
              {(config.header_font || config.header_font_en || config.body_font || config.body_font_en) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    onChange({
                      header_font: null,
                      header_font_en: null,
                      body_font: null,
                      body_font_en: null,
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Inherit Event Fonts
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Header Font */}
              <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-background/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5 text-gold" />
                    RSVP Header Font (ចំណងជើង)
                  </Label>
                  {config.header_font && (
                    <button
                      type="button"
                      onClick={() => onChange({ header_font: null })}
                      className="text-[11px] text-gold hover:underline"
                    >
                      Inherit ({globalHeaderFont || "Default"})
                    </button>
                  )}
                </div>

                <Select
                  value={config.header_font ?? "__inherit__"}
                  onValueChange={(val) =>
                    onChange({ header_font: val === "__inherit__" ? null : val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Inherit from event settings" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="__inherit__" className="text-xs font-medium text-muted-foreground">
                      Inherit event header font ({globalHeaderFont || "Default"})
                    </SelectItem>
                    {HEADER_FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="text-xs">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Applied to the RSVP question and kicker title.
                </p>
              </div>

              {/* Body Font */}
              <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-background/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5 text-gold" />
                    RSVP Body Font (ខ្លឹមសារ)
                  </Label>
                  {config.body_font && (
                    <button
                      type="button"
                      onClick={() => onChange({ body_font: null })}
                      className="text-[11px] text-gold hover:underline"
                    >
                      Inherit ({globalBodyFont || "Default"})
                    </button>
                  )}
                </div>

                <Select
                  value={config.body_font ?? "__inherit__"}
                  onValueChange={(val) =>
                    onChange({ body_font: val === "__inherit__" ? null : val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Inherit from event settings" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="__inherit__" className="text-xs font-medium text-muted-foreground">
                      Inherit event body font ({globalBodyFont || "Default"})
                    </SelectItem>
                    {BODY_FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="text-xs">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Applied to the greeting, status choices, notes, and submit button.
                </p>
              </div>
            </div>

            {/* Dual Language English Overrides */}
            {isDualLanguage && (
              <div className="pt-2 border-t border-border/50 space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  English Language Font Overrides
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">English Header Font</Label>
                      {config.header_font_en && (
                        <button
                          type="button"
                          onClick={() => onChange({ header_font_en: null })}
                          className="text-[11px] text-gold hover:underline"
                        >
                          Inherit
                        </button>
                      )}
                    </div>
                    <Select
                      value={config.header_font_en ?? "__inherit__"}
                      onValueChange={(val) =>
                        onChange({ header_font_en: val === "__inherit__" ? null : val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Inherit English header font" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="__inherit__" className="text-xs">
                          Inherit English event font
                        </SelectItem>
                        {HEADER_FONT_OPTIONS.filter((f) => f.category !== "khmer").map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">English Body Font</Label>
                      {config.body_font_en && (
                        <button
                          type="button"
                          onClick={() => onChange({ body_font_en: null })}
                          className="text-[11px] text-gold hover:underline"
                        >
                          Inherit
                        </button>
                      )}
                    </div>
                    <Select
                      value={config.body_font_en ?? "__inherit__"}
                      onValueChange={(val) =>
                        onChange({ body_font_en: val === "__inherit__" ? null : val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Inherit English body font" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="__inherit__" className="text-xs">
                          Inherit English event font
                        </SelectItem>
                        {BODY_FONT_OPTIONS.filter((f) => f.category !== "khmer").map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
