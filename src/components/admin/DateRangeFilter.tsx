import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DateRange = { from: Date; to: Date } | null;
export type RangePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "past_month"
  | "this_year"
  | "all"
  | "custom";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "past_month", label: "Past month" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range…" },
];

/** Compute the date range for a preset. Returns null for "all" (no filter). */
export function rangeFromPreset(p: RangePreset, custom?: DateRange): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (p) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "this_week": {
      // Monday-start week
      const day = now.getDay(); // 0=Sun … 6=Sat
      const diffToMon = (day + 6) % 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - diffToMon);
      return { from: startOfDay(mon), to: endOfDay(now) };
    }
    case "this_month":
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
    case "past_month": {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 1);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "this_year":
      return { from: startOfDay(new Date(now.getFullYear(), 0, 1)), to: endOfDay(now) };
    case "custom":
      return custom ?? null;
    case "all":
    default:
      return null;
  }
}

type Props = {
  preset: RangePreset;
  onPresetChange: (p: RangePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
};

/**
 * Compact date-range filter with quick presets and an optional custom calendar.
 * The custom popover only appears when the user picks "Custom range…".
 */
export default function DateRangeFilter({ preset, onPresetChange, customRange, onCustomRangeChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const label =
    preset === "custom" && customRange
      ? `${format(customRange.from, "MMM d")} – ${format(customRange.to, "MMM d, yyyy")}`
      : "Pick dates";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={preset}
        onValueChange={(v) => {
          onPresetChange(v as RangePreset);
          if (v === "custom") setOpen(true);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[220px] justify-start text-left font-normal",
                !customRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
              onSelect={(r) => {
                if (r?.from && r?.to) {
                  onCustomRangeChange({
                    from: new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate(), 0, 0, 0, 0),
                    to: new Date(r.to.getFullYear(), r.to.getMonth(), r.to.getDate(), 23, 59, 59, 999),
                  });
                } else if (r?.from) {
                  onCustomRangeChange({
                    from: new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate(), 0, 0, 0, 0),
                    to: new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate(), 23, 59, 59, 999),
                  });
                } else {
                  onCustomRangeChange(null);
                }
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
