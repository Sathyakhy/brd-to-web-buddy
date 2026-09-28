import React, { useEffect, useState } from "react";
import {
  SideFrameConfig,
  SideFramePlacement,
  normalizeSideFrameConfig,
} from "@/lib/sideFrame";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  Library,
  Upload,
  Check,
  Eye,
  Plus,
  Image as ImageIcon,
  Film,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import OrnamentalSideFrame from "../templates/OrnamentalSideFrame";
import { Link } from "react-router-dom";

export type LibraryFrame = {
  id: string;
  label: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
};

type Props = {
  config?: unknown;
  accentColor?: string | null;
  onChange: (next: SideFrameConfig) => void;
};

export default function SideFrameEditor({
  config,
  accentColor,
  onChange,
}: Props) {
  const current: SideFrameConfig = normalizeSideFrameConfig(config);
  const [libraryFrames, setLibraryFrames] = useState<LibraryFrame[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New frame upload state
  const [newLabel, setNewLabel] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Fetch all frames from ornamental_frames table in Asset Library
  const fetchLibraryFrames = async () => {
    setLoadingLibrary(true);
    const { data, error } = await (supabase as any)
      .from("ornamental_frames")
      .select("id,label,media_url,media_type,thumbnail_url")
      .order("position", { ascending: true })
      .order("label", { ascending: true });
    if (!error && data) {
      setLibraryFrames(data as LibraryFrame[]);
    }
    setLoadingLibrary(false);
  };

  useEffect(() => {
    fetchLibraryFrames();
  }, []);

  const patch = (p: Partial<SideFrameConfig>) => {
    onChange({ ...current, ...p });
  };

  const effectiveAccent = accentColor && accentColor.trim() ? accentColor.trim() : "#db9b0f";
  const effectiveColor = current.color || effectiveAccent;

  // Handle direct upload of an ornamental frame to Asset Library
  const handleDirectUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select an image or video file first");
      return;
    }
    const label = newLabel.trim() || uploadFile.name.replace(/\.[^/.]+$/, "");
    setUploadingFile(true);
    try {
      const ext = uploadFile.name.split(".").pop() || "png";
      const path = `frames/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const isVideo = uploadFile.type.startsWith("video/");

      const { error: uploadErr } = await supabase.storage
        .from("event-media")
        .upload(path, uploadFile, {
          upsert: false,
          contentType: uploadFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) {
        toast.error(uploadErr.message);
        return;
      }

      const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Insert into ornamental_frames table so it's permanently stored in Asset Library
      const { data: inserted, error: insertErr } = await (supabase as any)
        .from("ornamental_frames")
        .insert({
          label,
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image",
          thumbnail_url: null,
          position: 0,
        })
        .select("id,label,media_url,media_type,thumbnail_url")
        .single();

      if (insertErr) {
        toast.error(insertErr.message);
      } else {
        toast.success(`"${label}" added to Asset Library and selected!`);
        await fetchLibraryFrames();
        // Automatically select the newly uploaded frame
        patch({
          style: "custom",
          customUrl: publicUrl,
          mediaType: isVideo ? "video" : "image",
          frameAssetId: inserted?.id,
        });
      }

      setShowUploadModal(false);
      setUploadFile(null);
      setNewLabel("");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedLibraryFrame = libraryFrames.find(
    (f) => f.media_url === current.customUrl || f.id === current.frameAssetId
  );

  return (
    <div className="space-y-6 pt-1">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card/60 backdrop-blur shadow-2xs">
        <div className="space-y-0.5 pr-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Display ornamental frame on side of screen
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Display decorative frames uploaded from the Asset Library (Ornamental Frames) flanking the invitation.
          </p>
        </div>
        <Switch
          checked={current.enabled}
          onCheckedChange={(enabled) => patch({ enabled })}
          aria-label="Toggle ornamental side frame"
        />
      </div>

      {current.enabled && (
        <div className="space-y-6 p-4 rounded-xl border border-gold/20 bg-gold/5 animate-fade-in">
          {/* Asset Library Uploaded Frames Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Library className="h-4 w-4 text-gold" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Choose Frame from Asset Library
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  className="h-7 text-xs border-gold/40 text-gold hover:bg-gold/10"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Upload to Library
                </Button>
                <Link
                  to="/admin/asset-library?tab=frames"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-gold flex items-center gap-1 underline"
                >
                  <span>Manage Library</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {loadingLibrary ? (
              <div className="flex items-center justify-center p-6 border rounded-lg bg-background/50 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                Loading Asset Library frames…
              </div>
            ) : libraryFrames.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg bg-background/50 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No frames uploaded in the Asset Library yet.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUploadModal(true)}
                  className="text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload First Frame to Library
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {libraryFrames.map((f) => {
                  const isSelected =
                    current.customUrl === f.media_url || current.frameAssetId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        patch({
                          style: "custom",
                          customUrl: f.media_url,
                          mediaType: f.media_type,
                          frameAssetId: f.id,
                        })
                      }
                      className={`relative flex flex-col rounded-lg border overflow-hidden text-left transition-all group ${
                        isSelected
                          ? "border-gold ring-2 ring-gold bg-gold/15 shadow-sm"
                          : "border-border/80 bg-background hover:border-gold/60"
                      }`}
                    >
                      <div className="aspect-[3/4] w-full bg-[conic-gradient(at_top_left,_#f3f3f3_25%,_#e5e5e5_25%_50%,_#f3f3f3_50%_75%,_#e5e5e5_75%)] [background-size:12px_12px] flex items-center justify-center relative overflow-hidden">
                        {f.media_type === "video" ? (
                          <div className="w-full h-full relative flex items-center justify-center">
                            <video
                              src={f.media_url}
                              poster={f.thumbnail_url ?? undefined}
                              muted
                              loop
                              playsInline
                              className="h-full w-full object-contain"
                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                            <div className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5">
                              <Film className="h-3 w-3" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={f.thumbnail_url || f.media_url}
                            alt=""
                            className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        )}

                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-gold text-primary-foreground rounded-full p-0.5 shadow">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 bg-background/90 border-t border-border/50">
                        <div className="text-[11px] font-medium truncate text-foreground">
                          {f.label}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {f.media_type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active selection banner */}
          {current.customUrl ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-gold/40 bg-gold/10 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="h-4 w-4 text-gold shrink-0 stroke-[3]" />
                <span className="font-medium truncate">
                  Active Frame:{" "}
                  <strong className="text-foreground">
                    {selectedLibraryFrame?.label || "Uploaded Custom Frame"}
                  </strong>
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch({
                    customUrl: null,
                    frameAssetId: null,
                  })
                }
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear Frame
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-300">
              Please click on one of the frames above to apply it to your invitation sides.
            </div>
          )}

          {/* Placement & Color Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Side Placement */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Side Placement</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "both", label: "Both Sides" },
                  { value: "left", label: "Left Only" },
                  { value: "right", label: "Right Only" },
                ].map((item) => {
                  const active = (current.placement || "both") === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => patch({ placement: item.value as SideFramePlacement })}
                      className={`h-9 rounded-md border text-xs font-medium transition-all ${
                        active
                          ? "border-gold bg-gold/20 text-foreground font-semibold"
                          : "border-input bg-background hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tint Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Tint / Glow Colour</Label>
                {current.color && (
                  <button
                    type="button"
                    onClick={() => patch({ color: null })}
                    className="text-[11px] text-gold hover:underline"
                  >
                    Use Accent ({effectiveAccent})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={effectiveColor}
                  onChange={(e) => patch({ color: e.target.value })}
                  className="h-9 w-12 rounded border border-border bg-background cursor-pointer p-0.5"
                  aria-label="Side frame colour"
                />
                <Input
                  value={current.color ?? ""}
                  placeholder={effectiveAccent}
                  onChange={(e) => patch({ color: e.target.value || null })}
                  className="font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>

          {/* Width & Opacity Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Frame Width</span>
                <span className="text-muted-foreground font-mono">{current.width ?? 52}px</span>
              </div>
              <Slider
                value={[current.width ?? 52]}
                min={20}
                max={120}
                step={2}
                onValueChange={([val]) => patch({ width: val })}
              />
              <p className="text-[11px] text-muted-foreground">Width of the decorative side frame.</p>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Frame Opacity</span>
                <span className="text-muted-foreground font-mono">{current.opacity ?? 85}%</span>
              </div>
              <Slider
                value={[current.opacity ?? 85]}
                min={15}
                max={100}
                step={5}
                onValueChange={([val]) => patch({ opacity: val })}
              />
              <p className="text-[11px] text-muted-foreground">Transparency overlay effect on backgrounds.</p>
            </div>
          </div>

          {/* Responsive Scaling & Display Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Responsive Scaling Mode */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Responsive Scale Mode</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: "auto", label: "Fluid (Auto)", desc: "Scales smoothly" },
                  { value: "compact", label: "Compact", desc: "Ultra-slim" },
                  { value: "fixed", label: "Fixed", desc: "Constant px" },
                ].map((item) => {
                  const active = (current.responsiveScale || "auto") === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => patch({ responsiveScale: item.value as any })}
                      className={`p-2 rounded-md border text-center transition-all ${
                        active
                          ? "border-gold bg-gold/20 text-foreground font-semibold"
                          : "border-input bg-background hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs font-medium">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Mode / Flank */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Screen Alignment</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "screen-edge", label: "Screen Edges", desc: "Pins to viewport borders" },
                  { value: "content-flank", label: "Flank Card", desc: "Hugs central invitation" },
                ].map((item) => {
                  const active = (current.mode || "screen-edge") === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => patch({ mode: item.value as any })}
                      className={`p-2 rounded-md border text-center transition-all ${
                        active
                          ? "border-gold bg-gold/20 text-foreground font-semibold"
                          : "border-input bg-background hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs font-medium">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Display Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/90">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">Show on Mobile Screens</Label>
              <p className="text-[11px] text-muted-foreground">
                When enabled, renders subtly at the mobile screen edges with safe-area spacing.
              </p>
            </div>
            <Switch
              checked={current.showOnMobile !== false}
              onCheckedChange={(showOnMobile) => patch({ showOnMobile })}
            />
          </div>

          {/* Live Mini Preview Box */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-gold" />
              <span>Side Frame Live Appearance:</span>
            </div>
            <div className="relative h-28 w-full rounded-lg border border-gold/30 bg-[#fdf5dc] overflow-hidden flex items-center justify-center shadow-inner">
              <OrnamentalSideFrame
                config={current}
                accentColor={effectiveAccent}
                positionMode="absolute"
              />
              <div className="text-center px-4 z-10">
                <div
                  className="font-khmer-moul text-xs drop-shadow"
                  style={{ color: effectiveAccent }}
                >
                  សិរីសួស្តី អាពាហ៍ពិពាហ៍
                </div>
                <div className="text-[10px] text-[#3b1d12] mt-0.5">
                  Wedding Invitation Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog to add new frame to Asset Library */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-gold" />
              Upload Ornamental Frame to Asset Library
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Frame Name / Label</Label>
              <Input
                placeholder="e.g. Royal Golden Vine, Vintage Angkor Lace…"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Frame File (PNG, SVG, WEBP, or MP4/WebM Video)</Label>
              <Input
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg,video/mp4,video/webm"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setUploadFile(f);
                  if (f && !newLabel) {
                    setNewLabel(f.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                className="text-xs file:text-xs file:bg-secondary file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                For best results, upload a transparent PNG or SVG side border or video overlay.
              </p>
            </div>

            {uploadFile && (
              <div className="p-3 rounded-lg border bg-secondary/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  {uploadFile.type.startsWith("video/") ? (
                    <Film className="h-4 w-4 text-gold shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gold shrink-0" />
                  )}
                  <span className="truncate">{uploadFile.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadModal(false)}
              disabled={uploadingFile}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDirectUpload}
              disabled={uploadingFile || !uploadFile}
              className="text-xs bg-gold hover:bg-gold/90 text-primary-foreground gap-1.5"
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Save to Library & Apply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
