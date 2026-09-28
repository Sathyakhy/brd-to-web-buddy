import React, { useState } from "react";
import {
  EnvelopeUnboxingConfig,
  ENVELOPE_STYLES,
  SEAL_PATTERNS,
  EnvelopeStyle,
  SealPattern,
  UnboxingSpeed,
  UNBOXING_SPEED_OPTIONS,
  getUnboxingTiming,
  normalizeEnvelopeConfig,
} from "@/lib/envelopeUnboxing";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Check,
  RotateCcw,
  Layers,
  Stamp,
  Zap,
  Clock,
  Sliders,
  Plus,
  Minus,
} from "lucide-react";
import Interactive3DEnvelopeUnboxing from "@/components/templates/Interactive3DEnvelopeUnboxing";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  value?: EnvelopeUnboxingConfig | null;
  onChange: (next: EnvelopeUnboxingConfig) => void;
  accentColor?: string | null;
  templateDefault?: EnvelopeUnboxingConfig | null;
};

export default function EnvelopeUnboxingEditor({
  value,
  onChange,
  accentColor,
  templateDefault,
}: Props) {
  const cfg = normalizeEnvelopeConfig(value);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testKey, setTestKey] = useState(0);

  const update = (patch: Partial<EnvelopeUnboxingConfig>) => {
    onChange({ ...cfg, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle Card */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Interactive 3D Envelope Unboxing Animation
            </span>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
              3D Experience
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            When guests click "Open Invitation", opening the cover presents a breathtaking 3D unboxing animation (wax seal crackle, folding envelope, or royal gatefold doors) before revealing the invitation content.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
          />
        </div>
      </div>

      {cfg.enabled && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Quick Interactive Test Button */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview the 3D unboxing experience as your guests will see it</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setTestKey((k) => k + 1);
                setTestModalOpen(true);
              }}
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Test 3D Animation
            </Button>
          </div>

          {/* 1. Animation Styles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <Label className="text-sm font-semibold">Animation Style (របៀបបើក 3D)</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ENVELOPE_STYLES.map((style) => {
                const active = cfg.style === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => update({ style: style.id })}
                    className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      active
                        ? "border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/50"
                        : "border-border bg-card/60 hover:bg-secondary/60 hover:border-amber-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-foreground">
                          {style.name}
                        </span>
                        {active && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/80 font-medium mb-1">
                        {style.nameKm}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {style.description}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-amber-600/90 dark:text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {style.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Wax Seal & Stamp Customization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Stamp className="w-4 h-4 text-amber-500" />
              <Label className="text-sm font-semibold">Wax Seal & Stamp Medallion (ត្រាក្រមួនមាស)</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {SEAL_PATTERNS.map((pattern) => {
                const active = cfg.seal_pattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => update({ seal_pattern: pattern.id })}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      active
                        ? "border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50"
                        : "border-border bg-card/60 hover:bg-secondary/60"
                    }`}
                  >
                    <span className="text-2xl">{pattern.icon}</span>
                    <span className="text-[11px] font-medium">{pattern.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tactile Sound & Speed Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <Label className="text-sm font-semibold">Animation Speed & Timing (ល្បឿន & ថេរវេលា 3D)</Label>
              </div>
              {(() => {
                const timing = getUnboxingTiming(cfg);
                return (
                  <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3 mr-1" />
                    Duration: {timing.durationSec.toFixed(2)}s ({timing.tOpen}ms)
                  </Badge>
                );
              })()}
            </div>

            {/* Speed Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {UNBOXING_SPEED_OPTIONS.map((spd) => {
                const active = cfg.speed === spd.id;
                return (
                  <button
                    key={spd.id}
                    type="button"
                    onClick={() => {
                      if (spd.id === "custom") {
                        update({ speed: spd.id, custom_duration_sec: cfg.custom_duration_sec || 1.2 });
                      } else {
                        update({ speed: spd.id, custom_duration_sec: spd.durationSec });
                      }
                    }}
                    className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      active
                        ? "border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50"
                        : "border-border bg-card/60 hover:bg-secondary/60 hover:border-amber-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-base">{spd.icon}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          active ? "bg-amber-500 text-black font-bold" : "bg-secondary text-muted-foreground"
                        }`}>
                          {spd.badge}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {spd.name}
                      </p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        {spd.nameKm}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-Tuning Duration Slider */}
            <div className="p-3.5 rounded-xl border border-border bg-secondary/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">Fine-Tune Duration (កែសម្រួលថេរវេលា)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const current = cfg.custom_duration_sec || getUnboxingTiming(cfg).durationSec;
                      const next = Math.max(0.4, Number((current - 0.1).toFixed(2)));
                      update({ speed: "custom", custom_duration_sec: next });
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-background border border-border min-w-[4rem] text-center">
                    {(cfg.custom_duration_sec || getUnboxingTiming(cfg).durationSec).toFixed(2)}s
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const current = cfg.custom_duration_sec || getUnboxingTiming(cfg).durationSec;
                      const next = Math.min(4.0, Number((current + 0.1).toFixed(2)));
                      update({ speed: "custom", custom_duration_sec: next });
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTestKey((k) => k + 1);
                      setTestModalOpen(true);
                    }}
                    className="h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 ml-2"
                  >
                    <Play className="w-3 h-3 mr-1 fill-current" /> Test Speed
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-mono">0.4s (Fast)</span>
                <input
                  type="range"
                  min="0.4"
                  max="4.0"
                  step="0.05"
                  value={cfg.custom_duration_sec || getUnboxingTiming(cfg).durationSec}
                  onChange={(e) => {
                    const nextVal = parseFloat(e.target.value);
                    update({ speed: "custom", custom_duration_sec: nextVal });
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-secondary rounded-lg"
                />
                <span className="text-[10px] text-muted-foreground font-mono">4.0s (Slow)</span>
              </div>
            </div>

            {/* Tactile Sound FX Toggle */}
            <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  {cfg.sound_effects ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>Tactile Audio Effects (សម្លេងបើកស្រោម)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Play realistic wax seal crackle, paper flap swoosh, and sparkling chime on opening.
                </p>
              </div>
              <Switch
                checked={cfg.sound_effects}
                onCheckedChange={(checked) => update({ sound_effects: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Live Interactive 3D Unboxing Testing */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-black/95 border border-amber-500/30 text-white">
          <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-serif text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 3D Envelope Unboxing Live Test
            </DialogTitle>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setTestKey((k) => k + 1)}
              className="text-xs text-amber-300 hover:text-amber-100 hover:bg-white/10 h-7"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Replay
            </Button>
          </DialogHeader>

          <div className="relative w-full h-[520px] flex items-center justify-center bg-zinc-950">
            <Interactive3DEnvelopeUnboxing
              key={testKey}
              config={cfg}
              guestName="ភ្ញៀវកិត្តិយស (Sample Guest)"
              title="Wedding Celebration"
              language="km"
              accentColor={accentColor}
              isEmbedded={true}
              onComplete={() => {
                // Auto reset hint or allow closing
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
