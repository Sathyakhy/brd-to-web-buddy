import { useMemo, useState } from "react";
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

const EN_HONORIFIC_OPTIONS = [
  "Mr.",
  "Mrs.",
  "Oknha",
  "Lok Chumteav",
  "H.E.",
] as const;

const CUSTOM = "__custom__";

type Cell = { prefix: string; firstName: string; lastName: string };

function parseCell(line: string | undefined, defaultPrefix: string): Cell {
  if (!line) return { prefix: defaultPrefix, firstName: "", lastName: "" };
  const parts = line.split("|").map(s => s.trim());
  if (parts.length === 1) {
    return { prefix: defaultPrefix, firstName: parts[0], lastName: "" };
  }
  if (parts.length === 2) {
    return { prefix: parts[0], firstName: parts[1], lastName: "" };
  }
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
  isDual?: boolean;
  enGroomName?: string | null;
  enBrideName?: string | null;
  onChange: (next: { groom_name: string; bride_name: string }) => void;
  onEnChange?: (next: { groom_name: string; bride_name: string }) => void;
};

export default function ParentsEditor({
  groomName,
  brideName,
  isDual = false,
  enGroomName = null,
  enBrideName = null,
  onChange,
  onEnChange,
}: ParentsEditorProps) {
  const [activeLang, setActiveLang] = useState<"km" | "en">("km");

  // Determine current side values based on active editing language
  const currentGroomStr = (isDual && activeLang === "en") ? (enGroomName ?? "") : (groomName ?? "");
  const currentBrideStr = (isDual && activeLang === "en") ? (enBrideName ?? "") : (brideName ?? "");

  const groomLines = useMemo(
    () => currentGroomStr ? currentGroomStr.split(/\r?\n|\s\/\s/).map(s => s.trim()) : [],
    [currentGroomStr],
  );
  const brideLines = useMemo(
    () => currentBrideStr ? currentBrideStr.split(/\r?\n|\s\/\s/).map(s => s.trim()) : [],
    [currentBrideStr],
  );

  const defaultFatherPrefix = activeLang === "en" ? "Mr." : "លោក";
  const defaultMotherPrefix = activeLang === "en" ? "Mrs." : "លោកស្រី";

  // Parse lines: if 3 lines -> [father, mother, couple]
  // If 2 lines -> [father, mother, ""]
  // If 1 line -> ["", "", couple]
  // If 0 lines -> empty cells
  const parseSide = (lines: string[]) => {
    const emptyFather = { prefix: defaultFatherPrefix, firstName: "", lastName: "" };
    const emptyMother = { prefix: defaultMotherPrefix, firstName: "", lastName: "" };

    if (lines.length >= 3) {
      return {
        father: parseCell(lines[0], defaultFatherPrefix),
        mother: parseCell(lines[1], defaultMotherPrefix),
        couple: lines[2] || "",
      };
    }
    if (lines.length === 2) {
      return {
        father: parseCell(lines[0], defaultFatherPrefix),
        mother: parseCell(lines[1], defaultMotherPrefix),
        couple: "",
      };
    }
    if (lines.length === 1 && lines[0]) {
      return {
        father: emptyFather,
        mother: emptyMother,
        couple: lines[0],
      };
    }
    return {
      father: emptyFather,
      mother: emptyMother,
      couple: "",
    };
  };

  const groomParsed = parseSide(groomLines);
  const brideParsed = parseSide(brideLines);

  const groomFather = groomParsed.father;
  const groomMother = groomParsed.mother;
  const brideFather = brideParsed.father;
  const brideMother = brideParsed.mother;

  const groomCoupleLine = groomParsed.couple;
  const brideCoupleLine = brideParsed.couple;
  const splitCouple = (s: string): { first: string; last: string } => {
    const parts = s.split("|").map(p => p.trim());
    if (parts.length >= 3) return { first: parts[1] ?? "", last: parts.slice(2).join(" ") };
    if (parts.length === 2) return { first: parts[0], last: parts[1] };
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
    const updated = {
      groom_name: joinSide(next.gf ?? groomFather, next.gm ?? groomMother, next.groomCouple ?? groomCoupleLine),
      bride_name: joinSide(next.bf ?? brideFather, next.bm ?? brideMother, next.brideCouple ?? brideCoupleLine),
    };
    if (isDual && activeLang === "en") {
      onEnChange?.(updated);
    } else {
      onChange(updated);
    }
  };

  const honorificList = activeLang === "en" ? EN_HONORIFIC_OPTIONS : HONORIFIC_OPTIONS;

  const renderCell = (
    cell: Cell,
    onChangeCell: (c: Cell) => void,
    label: string,
  ) => {
    const isCustom = cell.prefix && !(honorificList as readonly string[]).includes(cell.prefix);
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground font-khmer-siemreap">{label}</Label>

        <div className="flex gap-2">
          <div className="w-40 shrink-0">
            <Select
              value={isCustom ? CUSTOM : (cell.prefix || honorificList[0])}
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
                {honorificList.map(h => (
                  <SelectItem key={h} value={h} className={activeLang === "en" ? "font-sans text-sm" : "font-khmer-koulen text-base"}>
                    {h}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM} className="font-khmer-siemreap">Custom…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCustom && (
            <Input
              className={`flex-1 ${activeLang === "en" ? "font-sans" : "font-khmer-koulen"}`}
              value={cell.prefix}
              placeholder="Custom title"
              onChange={(e) => onChangeCell({ ...cell, prefix: e.target.value })}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
            value={cell.firstName}
            placeholder={activeLang === "en" ? "First name" : "គោត្តនាម"}
            onChange={(e) => onChangeCell({ ...cell, firstName: e.target.value })}
          />
          <Input
            className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
            value={cell.lastName}
            placeholder={activeLang === "en" ? "Last name" : "នាមខ្លួន"}
            onChange={(e) => onChangeCell({ ...cell, lastName: e.target.value })}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium font-khmer-siemreap">Parents &amp; Couple Information</p>
          <p className="text-xs text-muted-foreground">Configure parents' honorifics and names for both sides.</p>
        </div>
        {isDual && (
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setActiveLang("km")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition ${
                activeLang === "km"
                  ? "bg-gold text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>🇰🇭</span> Khmer
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("en")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition ${
                activeLang === "en"
                  ? "bg-gold text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>🇬🇧</span> English
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCell(groomFather, c => emit({ gf: c }), activeLang === "en" ? "Groom side — Father" : "Groom side — Father (ឪពុកខាងកូនកំលោះ)")}
        {renderCell(brideFather, c => emit({ bf: c }), activeLang === "en" ? "Bride side — Father" : "Bride side — Father (ឪពុកខាងកូនក្រមុំ)")}
        {renderCell(groomMother, c => emit({ gm: c }), activeLang === "en" ? "Groom side — Mother" : "Groom side — Mother (ម្តាយខាងកូនកំលោះ)")}
        {renderCell(brideMother, c => emit({ bm: c }), activeLang === "en" ? "Bride side — Mother" : "Bride side — Mother (ម្តាយខាងកូនក្រមុំ)")}
      </div>

      <div className="pt-3 mt-2 border-t border-border/60">
        <p className="text-sm font-medium font-khmer-siemreap mb-2">
          {activeLang === "en" ? "Couple's Names (English)" : "Couple's Names (កូនប្រុស និង កូនស្រី)"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-khmer-siemreap">
              {activeLang === "en" ? "Groom Name" : "Groom (កូនប្រុសនាម)"}
            </Label>
            <Input
              className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
              value={groomCouple.first}
              placeholder={activeLang === "en" ? "First name" : "គោត្តនាម"}
              onChange={(e) => emit({ groomCouple: joinCouple(e.target.value, groomCouple.last) })}
            />
            <Input
              className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
              value={groomCouple.last}
              placeholder={activeLang === "en" ? "Last name" : "នាមខ្លួន"}
              onChange={(e) => emit({ groomCouple: joinCouple(groomCouple.first, e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-khmer-siemreap">
              {activeLang === "en" ? "Bride Name" : "Bride (កូនស្រីនាម)"}
            </Label>
            <Input
              className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
              value={brideCouple.first}
              placeholder={activeLang === "en" ? "First name" : "គោត្តនាម"}
              onChange={(e) => emit({ brideCouple: joinCouple(e.target.value, brideCouple.last) })}
            />
            <Input
              className={activeLang === "en" ? "font-sans" : "font-khmer-moul"}
              value={brideCouple.last}
              placeholder={activeLang === "en" ? "Last name" : "នាមខ្លួន"}
              onChange={(e) => emit({ brideCouple: joinCouple(brideCouple.first, e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
