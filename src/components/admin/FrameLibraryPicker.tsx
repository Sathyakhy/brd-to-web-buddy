import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Library, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type LibraryFrame = {
  id: string;
  label: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
};

type Props = {
  /** Currently selected frame URL (image or video). */
  value: string | null;
  /** Called when the user picks a frame from the library or clears it. */
  onChange: (next: { media_url: string; media_type: "image" | "video" } | null) => void;
  /** Optional preview placeholder shown when nothing selected. */
  placeholderUrl?: string | null;
  /** When true, an extra "Reset to default" button appears (clears value to null). */
  showReset?: boolean;
};

/**
 * FrameLibraryPicker — opens a modal that lists ornamental frames from the
 * Asset Library. Selection passes both the media URL and its type so callers
 * (Signature Package cover + invitation) know whether to render `<img>` or
 * `<video>`.
 *
 * Frames are managed in `/admin/asset-library?tab=frames` — this component
 * never uploads directly; it only reads.
 */
export default function FrameLibraryPicker({
  value, onChange, placeholderUrl, showReset = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [frames, setFrames] = useState<LibraryFrame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (supabase as any)
      .from("ornamental_frames")
      .select("id,label,media_url,media_type,thumbnail_url")
      .order("position", { ascending: true })
      .order("label", { ascending: true })
      .then(({ data, error }: any) => {
        if (!error) setFrames((data ?? []) as LibraryFrame[]);
        setLoading(false);
      });
  }, [open]);

  // Best-effort lookup of currently selected frame metadata so the preview
  // can decide between <img> and <video> without callers needing to track
  // media_type. Falls back to image if not found.
  const [currentMeta, setCurrentMeta] = useState<{ media_type: "image" | "video"; thumbnail_url: string | null } | null>(null);
  useEffect(() => {
    if (!value) { setCurrentMeta(null); return; }
    (supabase as any)
      .from("ornamental_frames")
      .select("media_type,thumbnail_url")
      .eq("media_url", value)
      .maybeSingle()
      .then(({ data }: any) => setCurrentMeta(data ?? { media_type: "image", thumbnail_url: null }));
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="w-full md:w-64 aspect-[3/4] rounded-lg overflow-hidden bg-[conic-gradient(at_top_left,_#f3f3f3_25%,_#e5e5e5_25%_50%,_#f3f3f3_50%_75%,_#e5e5e5_75%)] [background-size:16px_16px] border border-border flex items-center justify-center">
        {value && currentMeta?.media_type === "video" ? (
          <video
            src={value}
            poster={currentMeta?.thumbnail_url ?? undefined}
            autoPlay muted loop playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={value || placeholderUrl || "/templates/signature-package-01/frame.png"}
            alt="Frame preview"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Library className="h-4 w-4 mr-2" /> Pick from library
        </Button>
        {showReset && value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4 mr-2" /> Reset to default
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Manage frames in the{" "}
        <Link to="/admin/asset-library?tab=frames" className="underline hover:text-gold">
          Asset Library
        </Link>
        .
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose an ornamental frame</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">Loading…</div>
          ) : frames.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-md">
              No frames in the library yet.{" "}
              <Link to="/admin/asset-library?tab=frames" className="underline hover:text-gold">
                Add one in Asset Library
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {frames.map((f) => {
                const active = value === f.media_url;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onChange({ media_url: f.media_url, media_type: f.media_type });
                      setOpen(false);
                    }}
                    className={`relative rounded-md border overflow-hidden text-left transition-colors ${
                      active ? "border-gold ring-2 ring-gold/50" : "border-border hover:border-gold/50"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-[conic-gradient(at_top_left,_#f3f3f3_25%,_#e5e5e5_25%_50%,_#f3f3f3_50%_75%,_#e5e5e5_75%)] [background-size:14px_14px] flex items-center justify-center">
                      {f.media_type === "video" ? (
                        <video
                          src={f.media_url}
                          poster={f.thumbnail_url ?? undefined}
                          muted loop playsInline
                          className="h-full w-full object-contain"
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                      ) : (
                        <img
                          src={f.thumbnail_url || f.media_url}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="p-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{f.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {f.media_type}
                        </div>
                      </div>
                      {active && <Check className="h-4 w-4 text-gold shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
