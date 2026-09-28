import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export type ElementStyleEditorProps = {
  title: string;
  description?: string;
  color: string | null | undefined;
  opacity: number | null | undefined;
  defaultColor?: string;
  defaultOpacity?: number;
  onChange: (color: string | null, opacity: number | null) => void;
  className?: string;
};

export function hexWithOpacity(
  hex: string | null | undefined,
  opacityPct: number | null | undefined
): string {
  const op = typeof opacityPct === "number" ? Math.max(0, Math.min(100, opacityPct)) : 100;
  if (!hex) return `rgba(255, 255, 255, ${op / 100})`;
  const m = hex.replace("#", "").trim();
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${op / 100})`;
}

export default function ElementStyleEditor({
  title,
  description,
  color,
  opacity,
  defaultColor = "#ffffff",
  defaultOpacity = 85,
  onChange,
  className = "",
}: ElementStyleEditorProps) {
  const safeColor = color && /^#[0-9a-fA-F]{3,6}$/.test(color.replace("#", "")) ? color : defaultColor;
  const safeOpacity = typeof opacity === "number" ? Math.max(0, Math.min(100, opacity)) : defaultOpacity;

  const handleReset = () => {
    onChange(null, null);
  };

  const isCustomized = (color !== null && color !== undefined && color !== "") || (typeof opacity === "number");

  return (
    <div className={`rounded-lg border border-dashed border-border p-3 space-y-3 bg-secondary/20 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
            {title}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {isCustomized && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleReset}
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
            value={safeColor}
            onChange={(e) => onChange(e.target.value, typeof opacity === "number" ? opacity : safeOpacity)}
            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
            aria-label={`Pick background color for ${title}`}
          />
          <Input
            value={color ?? ""}
            onChange={(e) => onChange(e.target.value || null, opacity ?? null)}
            placeholder={defaultColor}
            className="w-32 font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Opacity</span>
            <span className="text-xs tabular-nums text-muted-foreground">{safeOpacity}%</span>
          </div>
          <Slider
            value={[safeOpacity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => onChange(color ?? null, v[0] ?? defaultOpacity)}
          />
        </div>
      </div>

      {/* Live preview chip */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Preview:</span>
        <div
          className="h-8 flex-1 rounded-md border border-border shadow-inner"
          style={{
            backgroundColor: hexWithOpacity(safeColor, safeOpacity),
          }}
        />
      </div>
    </div>
  );
}
