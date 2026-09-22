import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

/**
 * LetterCardStyleEditor — shared color + opacity controls for the
 * Apologies and Thank-you letter cards. Used inside both event-level and
 * template-level editors so the same fields render in two places. The
 * parent owns state via {@link onChange}; we just emit a partial patch.
 *
 * Notes:
 *  - Color is stored as a hex string (e.g. "#fff8e7"). A native color
 *    picker plus a free-text input let admins paste any hex.
 *  - Opacity is an integer 0–100. Defaults to 70 in the renderer.
 *  - "Reset" clears both fields back to null so the template default (or
 *    the renderer's built-in fallback) takes over.
 */
export type LetterCardStyleEditorProps = {
  color: string | null;
  opacity: number | null;
  onChange: (patch: { letter_bg_color?: string | null; letter_bg_opacity?: number | null }) => void;
  /** Optional title shown above the controls. */
  title?: string;
};

const DEFAULT_OPACITY = 70;

export default function LetterCardStyleEditor({
  color,
  opacity,
  onChange,
  title = "Card background",
}: LetterCardStyleEditorProps) {
  const safeColor = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#fff8e7";
  const safeOpacity = typeof opacity === "number" ? Math.max(0, Math.min(100, opacity)) : DEFAULT_OPACITY;
  return (
    <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-secondary/20">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onChange({ letter_bg_color: null, letter_bg_opacity: null })}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Applies to both the Apologies and Thank-you letter cards.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-3 items-center">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={safeColor}
            onChange={(e) => onChange({ letter_bg_color: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
            aria-label="Pick background color"
          />
          <Input
            value={color ?? ""}
            onChange={(e) => onChange({ letter_bg_color: e.target.value || null })}
            placeholder="#fff8e7"
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
            onValueChange={(v) => onChange({ letter_bg_opacity: v[0] ?? DEFAULT_OPACITY })}
          />
        </div>
      </div>

      {/* Live preview chip */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Preview:</span>
        <div
          className="h-8 flex-1 rounded-md border border-border"
          style={{
            backgroundColor: hexWithOpacity(safeColor, safeOpacity),
          }}
        />
      </div>
    </div>
  );
}

function hexWithOpacity(hex: string, opacityPct: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacityPct / 100})`;
}
