import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * CollapsibleSection — admin-panel section card that can be folded.
 *
 * Replaces the bare `<section className="rounded-xl border ... p-6">` pattern
 * with a header that toggles visibility of the body. The body keeps its own
 * padding so existing children render unchanged.
 *
 * Layout note: `rightSlot` is rendered **outside** the trigger button so it
 * may itself contain interactive controls (buttons, dialog triggers) without
 * producing nested-button HTML. Clicks inside the right slot do NOT toggle
 * the section.
 */
export type CollapsibleSectionProps = {
  title: string;
  description?: ReactNode;
  rightSlot?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export default function CollapsibleSection({
  title,
  description,
  rightSlot,
  defaultOpen = true,
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section className={cn("rounded-xl border border-border bg-card shadow-soft overflow-hidden", className)}>
        {/* Stack title + actions vertically on mobile so long action rows
            (e.g. Guests: Template / Import / Export / Add) don't push the
            title off-screen. Side-by-side from sm: up. */}
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
          <CollapsibleTrigger
            className="flex-1 min-w-0 flex items-center justify-between gap-3 p-5 text-left hover:bg-secondary/30 transition-colors"
            aria-expanded={open}
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl">{title}</h2>
              {description && open && (
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          {rightSlot && (
            <div className="flex items-center flex-wrap gap-1.5 px-5 pb-4 sm:pb-0 sm:pr-5 sm:pl-0 shrink-0">
              {rightSlot}
            </div>
          )}
        </div>
        <CollapsibleContent>
          <div className="px-6 pb-6 pt-0">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
