import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  MonogramShadowSettings,
  MonogramEffectType,
  MONOGRAM_EFFECT_PRESETS,
  DEFAULT_MONOGRAM_SETTINGS,
  computeMonogramFilter,
} from "@/lib/textEffects";
import { Sparkles, SlidersHorizontal, RotateCcw, Crown, Layers, Eye } from "lucide-react";

// Fallback sample monogram crest when no custom image is uploaded
const SAMPLE_MONOGRAM = "/lovable-uploads/7f671c66-fc93-4a0b-9c76-5743f1e94474.png";

type Props = {
  settings: MonogramShadowSettings;
  onChange: (settings: MonogramShadowSettings) => void;
  monogramUrl?: string | null;
  accentColor?: string | null;
};

const COLOR_SWATCHES = [
  { label: "Royal Gold", hex: "#ffc446" },
  { label: "Deep Amber", hex: "#db9b0f" },
  { label: "Pure White", hex: "#ffffff" },
  { label: "Warm Ivory", hex: "#fef3c7" },
  { label: "Rose Gold", hex: "#e0a19d" },
  { label: "Soft Charcoal", hex: "#262626" },
];

export default function MonogramEffectEditor({
  settings = DEFAULT_MONOGRAM_SETTINGS,
  onChange,
  monogramUrl,
  accentColor,
}: Props) {
  const [previewBg, setPreviewBg] = useState<"cream" | "dark" | "red" | "white">("cream");

  const filterStyle = computeMonogramFilter(settings);
  const displayImage = monogramUrl || SAMPLE_MONOGRAM;

  const handleApplyPreset = (presetId: MonogramEffectType) => {
    const preset = MONOGRAM_EFFECT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...settings,
      enabled: true,
      type: presetId,
      ...preset.defaults,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_MONOGRAM_SETTINGS });
  };

  const bgStyles = {
    cream: "bg-[#fcf8ee] border-[#e8dcb8]",
    dark: "bg-[#181512] border-[#382f25]",
    red: "bg-[#521316] border-[#7d2227]",
    white: "bg-white border-border",
  };

  return (
    <div className="space-y-5 rounded-lg border border-gold/30 bg-gold/5 p-4 sm:p-5">
      {/* Header with Enable Switch & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold/15 text-gold">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Monogram Drop Shadow &amp; Glow Effects
            </h4>
            <p className="text-xs text-muted-foreground">
              Add a regal glow, drop shadow, or halo around the couple's monogram / wedding logo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background/80 px-2.5 py-1 rounded-md border border-border">
            <Switch
              id="monogram-shadow-toggle"
              checked={settings.enabled}
              onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
            />
            <Label htmlFor="monogram-shadow-toggle" className="text-xs font-medium cursor-pointer">
              {settings.enabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            title="Reset to default royal gold glow"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {settings.enabled ? (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Controls Column */}
          <div className="space-y-5 lg:col-span-7">
            {/* Presets Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Style Presets
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MONOGRAM_EFFECT_PRESETS.map((preset) => {
                  const active = settings.type === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`text-left p-2.5 rounded-md border text-xs transition-all ${
                        active
                          ? "border-gold bg-gold/20 text-foreground ring-1 ring-gold/40 shadow-xs"
                          : "border-border bg-card/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Glow / Shadow Controls */}
            <div className="rounded-md border border-border bg-card/70 p-3.5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-gold" /> Primary Aura / Drop Shadow
                </span>
                <span className="text-[11px] text-muted-foreground">Outer blur &amp; projection</span>
              </div>

              {/* Color Picker & Swatches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label>Primary Glow Color</Label>
                  <span className="font-mono text-[11px] text-muted-foreground">{settings.color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="w-12 h-8 p-1 cursor-pointer"
                    value={settings.color || "#ffc446"}
                    onChange={(e) =>
                      onChange({ ...settings, color: e.target.value, type: "custom" })
                    }
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() =>
                          onChange({ ...settings, color: swatch.hex, type: "custom" })
                        }
                        className={`h-7 w-7 rounded-md border transition-transform hover:scale-110 flex items-center justify-center ${
                          settings.color.toLowerCase() === swatch.hex.toLowerCase()
                            ? "ring-2 ring-gold border-white"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                      />
                    ))}
                    {accentColor && (
                      <button
                        type="button"
                        onClick={() =>
                          onChange({ ...settings, color: accentColor, type: "custom" })
                        }
                        className="px-2 h-7 rounded-md border border-gold/40 text-[10px] bg-gold/10 text-gold hover:bg-gold/20"
                        title="Match template accent color"
                      >
                        Accent
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Blur Radius Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label>Glow / Blur Radius</Label>
                  <span className="font-mono text-muted-foreground">{settings.blur}px</span>
                </div>
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={[settings.blur]}
                  onValueChange={([val]) =>
                    onChange({ ...settings, blur: val, type: "custom" })
                  }
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label>Intensity / Opacity</Label>
                  <span className="font-mono text-muted-foreground">{settings.opacity}%</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[settings.opacity]}
                  onValueChange={([val]) =>
                    onChange({ ...settings, opacity: val, type: "custom" })
                  }
                />
              </div>

              {/* X / Y Offsets */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <Label>Offset X</Label>
                    <span className="font-mono text-muted-foreground">{settings.offset_x}px</span>
                  </div>
                  <Slider
                    min={-15}
                    max={15}
                    step={1}
                    value={[settings.offset_x]}
                    onValueChange={([val]) =>
                      onChange({ ...settings, offset_x: val, type: "custom" })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <Label>Offset Y</Label>
                    <span className="font-mono text-muted-foreground">{settings.offset_y}px</span>
                  </div>
                  <Slider
                    min={-15}
                    max={15}
                    step={1}
                    value={[settings.offset_y]}
                    onValueChange={([val]) =>
                      onChange({ ...settings, offset_y: val, type: "custom" })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Secondary Inner Rim / Highlight Halo */}
            <div className="rounded-md border border-border bg-card/70 p-3.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-gold" />
                  <Label
                    htmlFor="secondary-glow-toggle"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Secondary Inner Highlight / Rim Glow
                  </Label>
                </div>
                <Switch
                  id="secondary-glow-toggle"
                  checked={settings.secondary_glow}
                  onCheckedChange={(secondary_glow) =>
                    onChange({ ...settings, secondary_glow, type: "custom" })
                  }
                />
              </div>

              {settings.secondary_glow && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <Label>Highlight Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-10 h-7 p-1 cursor-pointer"
                        value={settings.secondary_color || "#ffffff"}
                        onChange={(e) =>
                          onChange({ ...settings, secondary_color: e.target.value, type: "custom" })
                        }
                      />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {settings.secondary_color || "#ffffff"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label>Rim Blur</Label>
                        <span className="font-mono text-muted-foreground">
                          {settings.secondary_blur ?? 4}px
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={15}
                        step={1}
                        value={[settings.secondary_blur ?? 4]}
                        onValueChange={([val]) =>
                          onChange({ ...settings, secondary_blur: val, type: "custom" })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label>Rim Opacity</Label>
                        <span className="font-mono text-muted-foreground">
                          {settings.secondary_opacity ?? 80}%
                        </span>
                      </div>
                      <Slider
                        min={10}
                        max={100}
                        step={5}
                        value={[settings.secondary_opacity ?? 80]}
                        onValueChange={([val]) =>
                          onChange({ ...settings, secondary_opacity: val, type: "custom" })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="space-y-3 lg:col-span-5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Eye className="h-3.5 w-3.5 text-gold" /> Live Monogram Preview
              </Label>
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-md border border-border">
                {(["cream", "dark", "red", "white"] as const).map((bgKey) => (
                  <button
                    key={bgKey}
                    type="button"
                    onClick={() => setPreviewBg(bgKey)}
                    className={`px-2 py-0.5 text-[10px] rounded capitalize transition-all ${
                      previewBg === bgKey
                        ? "bg-background text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {bgKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div
              className={`relative flex flex-col items-center justify-center p-6 rounded-lg border min-h-[260px] overflow-hidden transition-colors ${bgStyles[previewBg]}`}
            >
              {/* Subtle background ornamentation pattern */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at center, rgba(219,155,15,0.4) 0%, transparent 70%)",
                }}
              />

              {/* Rendered Monogram with Live Filter */}
              <div className="relative z-10 flex flex-col items-center">
                <img
                  src={displayImage}
                  alt="Monogram preview"
                  className="max-h-36 max-w-[210px] object-contain transition-all duration-200"
                  style={{ filter: filterStyle }}
                />

                <div className="mt-4 text-center">
                  <div
                    className="text-xs font-medium tracking-wide uppercase"
                    style={{
                      color:
                        previewBg === "dark" || previewBg === "red" ? "#fef3c7" : "#4a2a0a",
                    }}
                  >
                    Groom &amp; Bride Monogram
                  </div>
                  <div
                    className="text-[10px] font-mono mt-1 px-2 py-0.5 rounded bg-black/20 text-white/80 inline-block max-w-[220px] truncate"
                    title={filterStyle}
                  >
                    {filterStyle}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 The drop shadow wraps automatically around the transparent contours of your
              uploaded PNG/SVG monogram crest. Tweak the blur and aura to ensure clear visibility
              over both cover screens and invitation pages.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-md border border-dashed border-border bg-card/40 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Monogram drop shadow &amp; effects are currently <strong>disabled</strong>. The monogram
            will render with flat, natural colors and no background shadow.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...settings, enabled: true })}
            className="text-xs border-gold/40 text-gold hover:bg-gold/10"
          >
            Enable Monogram Drop Shadow
          </Button>
        </div>
      )}
    </div>
  );
}
