import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/**
 * ParentsEditor — structured editor for the 2×2 parents grid used by the
 * Khmer Traditional invitation template.
 *
 * Layout:
 *   row 1 (fathers)  →  groom-side  |  bride-side
 *   row 2 (mothers)  →  groom-side  |  bride-side
 *
 * Storage format (per cell, pipe-separated, encoded into the existing
 * `events.groom_name` / `events.bride_name` text columns, one cell per line):
 *
 *   "<prefix>|<firstName>|<lastName>"
 *
 * Backwards compatible: legacy "<prefix>|<fullName>" rows (no second pipe)
 * are read as { prefix, firstName: fullName, lastName: "" }.
 *
 * The 3rd line (the couple's own name) is preserved untouched so it keeps
 * showing in the names block on the invitation page.
 */

const HONORIFIC_OPTIONS = [
  "លោក",
  "លោកស្រី",
  "លោកឧកញ្ញ៉ា",
  "លោកជំទាវ",
  "ឯកឧត្តម",
] as const;
const CUSTOM = "__custom__";

type Cell = { prefix: string; firstName: string; lastName: string };

function parseCell(line: string | undefined, defaultPrefix: string): Cell {
  if (!line) return { prefix: defaultPrefix, firstName: "", lastName: "" };
  const parts = line.split("|").map(s => s.trim());
  if (parts.length === 1) {
    // Legacy: just a name, no prefix marker.
    return { prefix: defaultPrefix, firstName: parts[0], lastName: "" };
  }
  if (parts.length === 2) {
    // Legacy: "prefix|fullName" — treat as first name only.
    return { prefix: parts[0], firstName: parts[1], lastName: "" };
  }
  // New: "prefix|first|last" (last may be multi-word, keep remainder joined).
  return {
    prefix: parts[0],
    firstName: parts[1],
    lastName: parts.slice(2).join(" "),
  };
}

function serializeCell(cell: Cell): string {
  const prefix = cell.prefix.trim();
  const first = cell.firstName.trim();
  const last = cell.lastName.trim();
  if (!first && !last) return "";
  // Always emit 3 segments so the parser knows it's the structured form.
  return `${prefix}|${first}|${last}`;
}

/** Combine the 2 parent cells (+ existing couple name) into the legacy column value. */
function joinSide(parent1: Cell, parent2: Cell, coupleLine: string): string {
  const lines = [serializeCell(parent1), serializeCell(parent2)];
  while (lines.length < 2) lines.push("");
  if (coupleLine.trim()) lines.push(coupleLine.trim());
  while (lines.length > 0 && !lines[lines.length - 1]) lines.pop();
  return lines.join("\n");
}

export type ParentsEditorProps = {
  groomName: string | null;
  brideName: string | null;
  onChange: (next: { groom_name: string; bride_name: string }) => void;
};

export default function ParentsEditor({ groomName, brideName, onChange }: ParentsEditorProps) {
  const groomLines = useMemo(
    () => (groomName ?? "").split(/\n|\s\/\s/).map(s => s.trim()),
    [groomName],
  );
  const brideLines = useMemo(
    () => (brideName ?? "").split(/\n|\s\/\s/).map(s => s.trim()),
    [brideName],
  );

  const groomFather = parseCell(groomLines[0], "លោក");
  const groomMother = parseCell(groomLines[1], "លោកស្រី");
  const brideFather = parseCell(brideLines[0], "លោក");
  const brideMother = parseCell(brideLines[1], "លោកស្រី");

  // Preserve the (optional) 3rd line — the couple's own name.
  // Stored as "firstName|lastName" so the template can render them stacked.
  const groomCoupleLine = groomLines[2] ?? "";
  const brideCoupleLine = brideLines[2] ?? "";
  const splitCouple = (s: string): { first: string; last: string } => {
    const parts = s.split("|").map(p => p.trim());
    if (parts.length >= 2) return { first: parts[0], last: parts.slice(1).join(" ") };
    return { first: parts[0] ?? "", last: "" };
  };
  const joinCouple = (first: string, last: string): string => {
    const f = first.trim();
    const l = last.trim();
    if (!f && !l) return "";
    return `${f}|${l}`;
  };
  const groomCouple = splitCouple(groomCoupleLine);
  const brideCouple = splitCouple(brideCoupleLine);

  const emit = (next: {
    gf?: Cell; gm?: Cell; bf?: Cell; bm?: Cell;
    groomCouple?: string; brideCouple?: string;
  }) => {
    onChange({
      groom_name: joinSide(next.gf ?? groomFather, next.gm ?? groomMother, next.groomCouple ?? groomCoupleLine),
      bride_name: joinSide(next.bf ?? brideFather, next.bm ?? brideMother, next.brideCouple ?? brideCoupleLine),
    });
  };

  const renderCell = (
    cell: Cell,
    onChangeCell: (c: Cell) => void,
    label: string,
  ) => {
    const isCustom = cell.prefix && !HONORIFIC_OPTIONS.includes(cell.prefix as any);
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground font-khmer-siemreap">{label}</Label>

        {/* Prefix + custom prefix on its own row */}
        <div className="flex gap-2">
          <div className="w-40 shrink-0">
            <Select
              value={isCustom ? CUSTOM : (cell.prefix || HONORIFIC_OPTIONS[0])}
              onValueChange={(v) => {
                if (v === CUSTOM) {
                  onChangeCell({ ...cell, prefix: cell.prefix || "" });
                } else {
                  onChangeCell({ ...cell, prefix: v });
                }
              }}
            >
              <SelectTrigger className="h-9 font-khmer-siemreap"><SelectValue placeholder="Title" /></SelectTrigger>
              <SelectContent>
                {HONORIFIC_OPTIONS.map(h => (
                  <SelectItem key={h} value={h} className="font-khmer-koulen text-base">{h}</SelectItem>
                ))}
                <SelectItem value={CUSTOM} className="font-khmer-siemreap">Custom…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCustom && (
            <Input
              className="flex-1 font-khmer-koulen"
              value={cell.prefix}
              placeholder="Custom title"
              onChange={(e) => onChangeCell({ ...cell, prefix: e.target.value })}
            />
          )}
        </div>

        {/* First / Last name */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            className="font-khmer-moul"
            value={cell.firstName}
            placeholder="First name"
            onChange={(e) => onChangeCell({ ...cell, firstName: e.target.value })}
          />
          <Input
            className="font-khmer-moul"
            value={cell.lastName}
            placeholder="Last name"
            onChange={(e) => onChangeCell({ ...cell, lastName: e.target.value })}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
      <p className="text-sm font-medium font-khmer-siemreap">Parents</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCell(groomFather, c => emit({ gf: c }), "Groom side — Father")}
        {renderCell(brideFather, c => emit({ bf: c }), "Bride side — Father")}
        {renderCell(groomMother, c => emit({ gm: c }), "Groom side — Mother")}
        {renderCell(brideMother, c => emit({ bm: c }), "Bride side — Mother")}
      </div>

      {/* Couple's own names — first & last name on separate inputs.
          Stored on the 3rd line as "firstName|lastName" so the invitation
          template can render them stacked under the cover image. */}
      <div className="pt-3 mt-2 border-t border-border/60">
        <p className="text-sm font-medium font-khmer-siemreap mb-2">Couple's names</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-khmer-siemreap">Groom (កូនប្រុសនាម)</Label>
            <Input
              className="font-khmer-moul"
              value={groomCouple.first}
              placeholder="First name"
              onChange={(e) => emit({ groomCouple: joinCouple(e.target.value, groomCouple.last) })}
            />
            <Input
              className="font-khmer-moul"
              value={groomCouple.last}
              placeholder="Last name"
              onChange={(e) => emit({ groomCouple: joinCouple(groomCouple.first, e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-khmer-siemreap">Bride (កូនស្រីនាម)</Label>
            <Input
              className="font-khmer-moul"
              value={brideCouple.first}
              placeholder="First name"
              onChange={(e) => emit({ brideCouple: joinCouple(e.target.value, brideCouple.last) })}
            />
            <Input
              className="font-khmer-moul"
              value={brideCouple.last}
              placeholder="Last name"
              onChange={(e) => emit({ brideCouple: joinCouple(brideCouple.first, e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
