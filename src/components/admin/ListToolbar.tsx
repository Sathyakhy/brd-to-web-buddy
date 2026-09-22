import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SortOption = { value: string; label: string };
export type FilterOption = { value: string; label: string };

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** Optional category filter dropdown. */
  filter?: {
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    label?: string;
  };
  /** Optional secondary filter dropdown. */
  filter2?: {
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    label?: string;
  };
  /** Sort by selector. */
  sort: {
    value: string;
    onChange: (v: string) => void;
    options: SortOption[];
  };
  /** Result count text shown on the right. */
  resultCount?: number;
  totalCount?: number;
  resultLabel?: string; // e.g. "events"
};

/**
 * ListToolbar
 * Reusable search / filter / sort bar for admin list pages.
 */
export default function ListToolbar({
  search, onSearchChange, searchPlaceholder = "Search…",
  filter, filter2, sort,
  resultCount, totalCount, resultLabel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-card">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {filter && (
        <Select value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-auto min-w-[140px]">
            <SelectValue placeholder={filter.label ?? "Filter"} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {filter2 && (
        <Select value={filter2.value} onValueChange={filter2.onChange}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-auto min-w-[140px]">
            <SelectValue placeholder={filter2.label ?? "Filter"} />
          </SelectTrigger>
          <SelectContent>
            {filter2.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Select value={sort.value} onValueChange={sort.onChange}>
        <SelectTrigger className="flex-1 sm:flex-none sm:w-auto min-w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sort.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {(resultCount != null || totalCount != null) && (
        <div className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {resultCount ?? 0}{totalCount != null && totalCount !== resultCount ? ` of ${totalCount}` : ""} {resultLabel}
        </div>
      )}
    </div>
  );
}
