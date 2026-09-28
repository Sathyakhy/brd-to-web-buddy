import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FontOption,
  HEADER_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
} from "@/lib/fonts";
import { Type as TypeIcon, Sparkles, RefreshCw } from "lucide-react";

type Props = {
  type: "header" | "body";
  label?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  description?: string;
  accentColor?: string | null;
  language?: "km" | "en" | "all";
};

export default function FontSelector({
  type,
  label,
  value,
  onChange,
  description,
  accentColor = "#db9b0f",
  language = "all",
}: Props) {
  const options = type === "header" ? HEADER_FONT_OPTIONS : BODY_FONT_OPTIONS;
  const isEn = language === "en";

  const defaultLabel = isEn
    ? type === "header"
      ? "Cinzel (Default English Royal Serif)"
      : "Plus Jakarta Sans (Default Clean)"
    : type === "header"
    ? "Khmer OS Moul (Default Classic)"
    : "Siemreap (Default Traditional)";

  const isCustom = Boolean(value && !options.some((o) => o.value.toLowerCase() === value.toLowerCase()));
  const [customMode, setCustomMode] = useState(isCustom);

  const resolvedValue = value?.trim() || "";

  const khmerOptions = options.filter((o) => o.category === "khmer");
  const latinOptions = options.filter((o) => o.category === "latin");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5 text-gold" />
          {label || (type === "header" ? "Heading & Title Font" : "Body & Content Font")}
        </Label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setCustomMode(false);
            }}
            className="text-[11px] text-gold hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Reset Default
          </button>
        )}
      </div>

      {!customMode ? (
        <div className="space-y-2">
          <Select
            value={resolvedValue || "__default__"}
            onValueChange={(val) => {
              if (val === "__custom__") {
                setCustomMode(true);
              } else if (val === "__default__") {
                onChange(null);
              } else {
                onChange(val);
              }
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={defaultLabel} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__default__" className="text-xs font-medium">
                {defaultLabel}
              </SelectItem>

              {/* In English mode, show Latin fonts first */}
              {isEn ? (
                <>
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    English / Latin Fonts
                  </div>
                  {latinOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span style={{ fontFamily: `"${opt.value}", serif` }}>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-t border-border/50 mt-1">
                    Khmer Fonts
                  </div>
                  {khmerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span style={{ fontFamily: `"${opt.value}", sans-serif` }}>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Khmer Fonts
                  </div>
                  {khmerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span style={{ fontFamily: `"${opt.value}", sans-serif` }}>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-t border-border/50 mt-1">
                    English / Latin Fonts
                  </div>
                  {latinOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span style={{ fontFamily: `"${opt.value}", serif` }}>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}

              <SelectItem value="__custom__" className="text-xs text-gold border-t border-border/50 mt-1">
                + Type Custom Font Family Name…
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Live sample preview */}
          <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-center overflow-hidden">
            <div
              className={`truncate transition-all ${
                type === "header"
                  ? "text-base font-bold text-gradient-gold"
                  : "text-xs text-foreground"
              }`}
              style={{
                fontFamily: resolvedValue
                  ? `"${resolvedValue}", sans-serif`
                  : isEn
                  ? type === "header"
                    ? '"Cinzel", "Playfair Display", serif'
                    : '"Plus Jakarta Sans", "Inter", sans-serif'
                  : type === "header"
                  ? '"Khmer OS Moul", "Moul", serif'
                  : '"Siemreap", "Battambang", sans-serif',
                color: type === "header" ? accentColor || "#db9b0f" : undefined,
              }}
            >
              {isEn
                ? type === "header"
                  ? "The Wedding Celebration (Heading Font)"
                  : "Cordially invite you to celebrate with our family & friends."
                : type === "header"
                ? "សិរីសួស្តី អាពាហ៍ពិពាហ៍ (Wedding Title)"
                : "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ និងភ្ញៀវកិត្តិយស"}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={resolvedValue}
              onChange={(e) => onChange(e.target.value || null)}
              placeholder={isEn ? "e.g. 'Cinzel', 'Playfair Display', 'Inter'…" : "e.g. 'Koulen', 'Bokor', 'Fasthand'…"}
              className="h-9 text-xs flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomMode(false)}
              className="h-9 text-xs"
            >
              Preset List
            </Button>
          </div>
          {resolvedValue && (
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-center">
              <div
                className="text-xs truncate"
                style={{ fontFamily: `"${resolvedValue}", sans-serif` }}
              >
                {isEn
                  ? `Sample: The Wedding of Alex & Sophia — Cordially Invite You`
                  : `Sample: សិរីសួស្តី អាពាហ៍ពិពាហ៍ — Cordially Invite You`}
              </div>
            </div>
          )}
        </div>
      )}

      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
  );
}
