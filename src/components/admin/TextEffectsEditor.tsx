import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TextEffectConfig,
  TextShadowSettings,
  TEXT_EFFECT_PRESETS,
  TextEffectType,
  computeTextShadow,
  computeMonogramFilter,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_BODY_SETTINGS,
  DEFAULT_MONOGRAM_SETTINGS,
} from "@/lib/textEffects";
import { Sparkles, SlidersHorizontal, RotateCcw, Copy, Crown, FileText, Heart } from "lucide-react";
import MonogramEffectEditor from "./MonogramEffectEditor";

type Props = {
  config: TextEffectConfig;
  onChange: (config: TextEffectConfig) => void;
  accentColor?: string | null;
  primaryColor?: string | null;
  headerFont?: string | null;
  bodyFont?: string | null;
  monogramUrl?: string | null;
};

export default function TextEffectsEditor({
  config,
  onChange,
  accentColor = "#db9b0f",
  primaryColor = "#333333",
  headerFont,
  bodyFont,
  monogramUrl,
}: Props) {
  const [activeTab, setActiveTab] = useState<"header" | "body" | "monogram">("header");

  const sampleHeadingShadow = computeTextShadow(config, true);
  const sampleBodyShadow = computeTextShadow(config, false);
  const sampleMonogramFilter = computeMonogramFilter(config);

  const handleApplyPreset = (target: "header" | "body", presetId: TextEffectType) => {
    const preset = TEXT_EFFECT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (config.separate_header_body) {
      const currentTarget = target === "header" ? config.header : config.body;
      const updated: TextShadowSettings = {
        ...currentTarget,
        type: presetId,
        ...preset.defaults,
      };
      onChange({
        ...config,
        [target]: updated,
      });
    } else {
      onChange({
        ...config,
        type: presetId,
        header: { ...config.header, type: presetId, ...preset.defaults },
        body: { ...config.body, type: presetId, ...preset.defaults },
      });
    }
  };

  const updateTargetSettings = (
    target: "header" | "body",
    patch: Partial<TextShadowSettings>
  ) => {
    if (config.separate_header_body) {
      const current = target === "header" ? config.header : config.body;
      onChange({
        ...config,
        [target]: {
          ...current,
          ...patch,
        },
      });
    } else {
      onChange({
        ...config,
        header: { ...config.header, ...patch },
        body: { ...config.body, ...patch },
        ...patch,
      });
    }
  };

  const copyHeaderToBody = () => {
    onChange({
      ...config,
      body: { ...config.header },
    });
  };

  const copyBodyToHeader = () => {
    onChange({
      ...config,
      header: { ...config.body },
    });
  };

  const currentSettings: TextShadowSettings =
    activeTab === "header" ? config.header : config.body;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-card/60">
      {/* Main Header & Global Toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <Label className="text-sm font-semibold cursor-pointer" htmlFor="text-effect-toggle">
              Text Drop Shadow &amp; Effects
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Apply glowing halos, soft shadows, or golden outlines independently to headings and body text.
          </p>
        </div>
        <Switch
          id="text-effect-toggle"
          checked={config.enabled}
          onCheckedChange={(enabled) => onChange({ ...config, enabled })}
        />
      </div>

      {config.enabled && (
        <div className="space-y-5 pt-1">
          {/* Live Dual Preview Box */}
          <div className="rounded-md border border-border bg-gradient-to-br from-[#fdf5dc] to-[#f4e6be] p-4 text-center overflow-hidden shadow-inner">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#7a5c2d] mb-2 flex items-center justify-center gap-1">
              <span>Live Typography &amp; Monogram Preview</span>
            </div>

            {/* Monogram Live Preview */}
            <div className="flex justify-center mb-3">
              <img
                src={monogramUrl || "/lovable-uploads/7f671c66-fc93-4a0b-9c76-5743f1e94474.png"}
                alt="Groom & Bride Monogram"
                className="h-14 sm:h-16 w-auto object-contain transition-all duration-200"
                style={{ filter: sampleMonogramFilter }}
              />
            </div>

            {/* Header Text Preview */}
            <div
              className="text-lg sm:text-2xl font-bold mb-1.5 transition-all px-2"
              style={{
                fontFamily: headerFont ? `"${headerFont}", serif` : '"Khmer OS Moul", "Moul", serif',
                color: accentColor || "#db9b0f",
                textShadow: sampleHeadingShadow,
              }}
            >
              សិរីសួស្តី អាពាហ៍ពិពាហ៍
            </div>

            {/* Body Text Preview */}
            <div
              className="text-xs sm:text-sm transition-all px-2 max-w-md mx-auto"
              style={{
                fontFamily: bodyFont ? `"${bodyFont}", sans-serif` : '"Siemreap", "Battambang", sans-serif',
                color: primaryColor || "#3b1d12",
                textShadow: sampleBodyShadow,
              }}
            >
              សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ និងភ្ញៀវកិត្តិយស
            </div>
          </div>

          {/* Tab Navigation for Header vs Body vs Monogram */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "header" | "body" | "monogram")}
            className="w-full space-y-4"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="header" className="text-xs gap-1 sm:gap-1.5">
                <Crown className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="truncate">Headings</span>
              </TabsTrigger>
              <TabsTrigger value="body" className="text-xs gap-1 sm:gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="truncate">Body Text</span>
              </TabsTrigger>
              <TabsTrigger value="monogram" className="text-xs gap-1 sm:gap-1.5">
                <Heart className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="truncate">Monogram</span>
              </TabsTrigger>
            </TabsList>

            {/* Section Settings: Header */}
            <TabsContent value="header" className="space-y-4 mt-0">
              <div className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">
                    Independent Headings &amp; Body Controls
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, headings have their own shadow color, blur, and offsets.
                  </p>
                </div>
                <Switch
                  checked={config.separate_header_body}
                  onCheckedChange={(separate_header_body) =>
                    onChange({ ...config, separate_header_body })
                  }
                />
              </div>

              <ShadowControlPanel
                title="Heading & Title Shadow Effects"
                settings={config.header}
                onChange={(patch) => updateTargetSettings("header", patch)}
                onPreset={(presetId) => handleApplyPreset("header", presetId)}
                onCopyToOther={copyHeaderToBody}
                copyButtonLabel="Copy this style to Body"
                showCopy={config.separate_header_body}
                defaultColor="#db9b0f"
              />
            </TabsContent>

            {/* Section Settings: Body */}
            <TabsContent value="body" className="space-y-4 mt-0">
              <div className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">
                    Independent Headings &amp; Body Controls
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, body text has its own shadow color, blur, and offsets.
                  </p>
                </div>
                <Switch
                  checked={config.separate_header_body}
                  onCheckedChange={(separate_header_body) =>
                    onChange({ ...config, separate_header_body })
                  }
                />
              </div>

              <ShadowControlPanel
                title="Body Text Shadow Effects"
                settings={config.body}
                onChange={(patch) => updateTargetSettings("body", patch)}
                onPreset={(presetId) => handleApplyPreset("body", presetId)}
                onCopyToOther={copyBodyToHeader}
                copyButtonLabel="Copy this style to Headings"
                showCopy={config.separate_header_body}
                defaultColor="#ffffff"
              />
            </TabsContent>

            {/* Section Settings: Monogram */}
            <TabsContent value="monogram" className="space-y-4 mt-0">
              <MonogramEffectEditor
                settings={config.monogram || DEFAULT_MONOGRAM_SETTINGS}
                onChange={(monogram) => onChange({ ...config, monogram })}
                monogramUrl={monogramUrl}
                accentColor={accentColor}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function ShadowControlPanel({
  title,
  settings,
  onChange,
  onPreset,
  onCopyToOther,
  copyButtonLabel,
  showCopy,
  defaultColor = "#ffffff",
}: {
  title: string;
  settings: TextShadowSettings;
  onChange: (patch: Partial<TextShadowSettings>) => void;
  onPreset: (presetId: TextEffectType) => void;
  onCopyToOther?: () => void;
  copyButtonLabel?: string;
  showCopy?: boolean;
  defaultColor?: string;
}) {
  return (
    <div className="space-y-4 rounded-md border border-border/70 p-3.5 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">{title}</Label>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
        </div>
        {showCopy && onCopyToOther && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCopyToOther}
            className="h-7 px-2 text-[11px] text-gold hover:text-gold/90 gap-1"
          >
            <Copy className="h-3 w-3" />
            {copyButtonLabel}
          </Button>
        )}
      </div>

      {settings.enabled && (
        <div className="space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Presets
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEXT_EFFECT_PRESETS.map((preset) => {
                const isSelected = settings.type === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onPreset(preset.id)}
                    className={`flex flex-col items-start p-2.5 rounded-md border text-left text-xs transition-all ${
                      isSelected
                        ? "border-gold bg-gold/15 text-foreground ring-1 ring-gold shadow-2xs"
                        : "border-border bg-background hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold text-foreground">{preset.label}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Chooser */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Shadow / Glow Colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  settings.color && settings.color.startsWith("#") && settings.color.length === 7
                    ? settings.color
                    : defaultColor
                }
                onChange={(e) => onChange({ color: e.target.value })}
                className="h-9 w-12 rounded border border-border bg-background cursor-pointer p-0.5"
                aria-label="Shadow colour"
              />
              <Input
                value={settings.color}
                onChange={(e) => onChange({ color: e.target.value })}
                placeholder={defaultColor}
                className="h-9 flex-1 text-xs font-mono"
              />
              <div className="flex gap-1">
                {["#ffffff", "#000000", "#db9b0f", "#fad074", "#6d1b29"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ color: c })}
                    className="h-7 w-7 rounded border border-border shadow-2xs hover:scale-105 transition-transform"
                    style={{ background: c }}
                    title={`Pick ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Fine-Tune Parameters</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onPreset(settings.type)}
                title="Reset sliders to preset defaults"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Blur Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Blur Radius</span>
                  <span className="font-mono font-medium">{settings.blur}px</span>
                </div>
                <Slider
                  min={0}
                  max={25}
                  step={1}
                  value={[settings.blur]}
                  onValueChange={([val]) => onChange({ blur: val })}
                />
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Opacity</span>
                  <span className="font-mono font-medium">{settings.opacity}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.opacity]}
                  onValueChange={([val]) => onChange({ opacity: val })}
                />
              </div>

              {/* Offset X */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Horizontal Offset (X)</span>
                  <span className="font-mono font-medium">{settings.offset_x}px</span>
                </div>
                <Slider
                  min={-15}
                  max={15}
                  step={1}
                  value={[settings.offset_x]}
                  onValueChange={([val]) => onChange({ offset_x: val })}
                />
              </div>

              {/* Offset Y */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vertical Offset (Y)</span>
                  <span className="font-mono font-medium">{settings.offset_y}px</span>
                </div>
                <Slider
                  min={-15}
                  max={15}
                  step={1}
                  value={[settings.offset_y]}
                  onValueChange={([val]) => onChange({ offset_y: val })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
