import { cn } from "@/lib/utils";

type Variant = "pending" | "yes" | "no" | "default";

const styles: Record<Variant, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  yes: "bg-success/10 text-success border-success/30",
  no: "bg-destructive/10 text-destructive border-destructive/30",
  default: "bg-muted text-muted-foreground border-border",
};

const labels: Record<Variant, string> = {
  pending: "Pending",
  yes: "Attending",
  no: "Declined",
  default: "—",
};

export function RsvpBadge({ status }: { status: string | null | undefined }) {
  const v = (status as Variant) in styles ? (status as Variant) : "default";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles[v]
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full",
        v === "pending" && "bg-warning",
        v === "yes" && "bg-success",
        v === "no" && "bg-destructive",
        v === "default" && "bg-muted-foreground"
      )} />
      {labels[v]}
    </span>
  );
}
