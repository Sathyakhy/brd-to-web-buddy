import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles, LayoutList, LayoutGrid } from "lucide-react";
import type { AgendaViewStyle } from "@/lib/agenda";

export type AgendaStylePatch = {
  agenda_asset_color?: string | null;
  agenda_bg_color?: string | null;
  agenda_bg_opacity?: number | null;
  agenda_view_style?: AgendaViewStyle;
};

export type AgendaStyleEditorProps = {
  assetColor?: string | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  viewStyle?: AgendaViewStyle;
  defaultAssetColor?: string;
  defaultBgColor?: string;
  defaultBgOpacity?: number;
  onChange: (patch: AgendaStylePatch) => void;
  onChangeViewStyle?: (v: AgendaViewStyle) => void;
  title?: string;
  showViewStyleToggle?: boolean;
};

export function hexWithOpacity(hex: string | null | undefined, opacityPct: number): string {
  if (!hex) return `rgba(255, 248, 231, ${opacityPct / 100})`;
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`;
}

export default function AgendaStyleEditor({
  assetColor,
  bgColor,
  bgOpacity,
  viewStyle = "list",
  defaultAssetColor = "#c89b3c",
  defaultBgColor = "#fff8e7",
  defaultBgOpacity = 70,
  onChange,
  onChangeViewStyle,
  title = "Agenda Appearance & Colors",
  showViewStyleToggle = true,
}: AgendaStyleEditorProps) {
  const safeAssetColor = assetColor && /^#[0-9a-fA-F]{6}$/.test(assetColor) ? assetColor : defaultAssetColor;
  const safeBgColor = bgColor && /^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : defaultBgColor;
  const safeOpacity = typeof bgOpacity === "number" ? Math.max(0, Math.min(100, bgOpacity)) : defaultBgOpacity;

  const handleResetAll = () => {
    onChange({
      agenda_asset_color: null,
      agenda_bg_color: null,
      agenda_bg_opacity: null,
    });
  };

  const previewBackground = hexWithOpacity(safeBgColor, safeOpacity);

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4 bg-secondary/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
            {title}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the Agenda asset icon color, section background tint, and opacity level.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleResetAll}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset styles
        </Button>
      </div>

      {showViewStyleToggle && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs text-foreground/90 font-medium">Layout style</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewStyle === "list" ? "default" : "outline"}
              className={`h-8 text-xs ${viewStyle === "list" ? "bg-gold text-primary-foreground hover:bg-gold/90" : ""}`}
              onClick={() => {
                if (onChangeViewStyle) onChangeViewStyle("list");
                else onChange({ agenda_view_style: "list" });
              }}
            >
              <LayoutList className="h-3.5 w-3.5 mr-1.5" />
              List layout
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewStyle === "card" ? "default" : "outline"}
              className={`h-8 text-xs ${viewStyle === "card" ? "bg-gold text-primary-foreground hover:bg-gold/90" : ""}`}
              onClick={() => {
                if (onChangeViewStyle) onChangeViewStyle("card");
                else onChange({ agenda_view_style: "card" });
              }}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Card grid
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Agenda Asset / Icon Color */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-foreground/90 font-medium">Agenda asset &amp; icon colour</Label>
            {assetColor && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => onChange({ agenda_asset_color: null })}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={safeAssetColor}
              onChange={(e) => onChange({ agenda_asset_color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
              aria-label="Pick agenda asset color"
            />
            <Input
              value={assetColor ?? ""}
              onChange={(e) => onChange({ agenda_asset_color: e.target.value || null })}
              placeholder={defaultAssetColor}
              className="w-32 font-mono text-xs h-9"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Applies to agenda icons, subheaders, category dividers, and timeline accents.
          </p>
        </div>

        {/* Agenda Background Color */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-foreground/90 font-medium">Agenda background colour</Label>
            {bgColor && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => onChange({ agenda_bg_color: null })}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={safeBgColor}
              onChange={(e) => onChange({ agenda_bg_color: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
              aria-label="Pick agenda background color"
            />
            <Input
              value={bgColor ?? ""}
              onChange={(e) => onChange({ agenda_bg_color: e.target.value || null })}
              placeholder={defaultBgColor}
              className="w-32 font-mono text-xs h-9"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Background tint for the whole agenda section card.
          </p>
        </div>

        {/* Agenda Opacity Slider */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-foreground/90 font-medium">Background opacity level</Label>
            <span className="text-xs tabular-nums text-muted-foreground font-mono">{safeOpacity}%</span>
          </div>
          <Slider
            value={[safeOpacity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => onChange({ agenda_bg_opacity: v[0] ?? defaultBgOpacity })}
            className="py-1"
          />
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Live Agenda Style Preview:</span>
          <span className="text-[11px]">Asset: {safeAssetColor} · Bg: {safeBgColor} ({safeOpacity}%)</span>
        </div>
        <div
          className="p-3.5 rounded-xl border transition-all flex flex-col gap-2"
          style={{
            backgroundColor: previewBackground,
            borderColor: `${safeAssetColor}40`,
            backdropFilter: "blur(2px)",
          }}
        >
          {/* Subheader preview */}
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: safeAssetColor }}>
            <span
              className="inline-block h-px flex-1"
              style={{ background: `linear-gradient(to right, transparent, ${safeAssetColor}, transparent)` }}
            />
            <span>ពេលព្រឹក / Morning Ceremony</span>
            <span
              className="inline-block h-px flex-1"
              style={{ background: `linear-gradient(to right, transparent, ${safeAssetColor}, transparent)` }}
            />
          </div>

          {/* Agenda item sample */}
          <div className="flex items-center gap-2.5 py-1 px-1">
            <span className="text-xs font-medium text-foreground/80 tabular-nums">07:00 AM</span>
            <div
              className="rounded-full shrink-0"
              style={{
                width: 2,
                height: 18,
                background: `linear-gradient(to bottom, transparent, ${safeAssetColor}, transparent)`,
              }}
            />
            <div className="shrink-0 flex items-center justify-center">
              <Sparkles className="h-4 w-4" style={{ color: safeAssetColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground/90">ពិធីហែជំនូន (Groom's Procession)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
