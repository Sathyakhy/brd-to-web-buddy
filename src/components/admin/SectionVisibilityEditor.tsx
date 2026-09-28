import { Switch } from "@/components/ui/switch";
import {
  SECTION_DEFINITIONS,
  SectionKey,
  SectionVisibility,
} from "@/lib/sectionVisibility";

type Props = {
  /** Current overrides (empty object = inherit defaults). */
  value: SectionVisibility;
  onChange: (next: SectionVisibility) => void;
  /** Optional template defaults — used to render a "default: shown/hidden" hint. */
  templateDefaults?: SectionVisibility;
};

/**
 * Renders a list of toggles — one per section in the order they appear on the
 * invitation. A toggle reflects the *resolved* visibility (override > template
 * default > built-in true). Flipping the toggle writes an explicit override to
 * `value`. Clicking "Reset" removes the override so the section follows its
 * template default again.
 */
export default function SectionVisibilityEditor({
  value,
  onChange,
  templateDefaults = {},
}: Props) {
  const setKey = (key: SectionKey, v: boolean) => onChange({ ...value, [key]: v });
  const clearKey = (key: SectionKey) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {SECTION_DEFINITIONS.map(({ key, label, description }) => {
        const tplDefault = templateDefaults[key];
        const override = value[key];
        const resolved = override ?? tplDefault ?? true;
        const isOverride = typeof override === "boolean";
        return (
          <div
            key={key}
            className="flex items-start justify-between gap-3 p-3 rounded-md border border-border bg-secondary/30"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
              {isOverride && (
                <button
                  type="button"
                  onClick={() => clearKey(key)}
                  className="mt-1 text-[11px] text-gold hover:underline"
                >
                  Reset to template default ({tplDefault === false ? "hidden" : "shown"})
                </button>
              )}
            </div>
            <Switch checked={resolved} onCheckedChange={(v) => setKey(key, v)} />
          </div>
        );
      })}
    </div>
  );
}
