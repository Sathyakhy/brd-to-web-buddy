import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Upload, X, ArrowLeft, Library, Frame, ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AgendaPreset = {
  id: string;
  label: string;
  description: string | null;
  icon: string;
  icon_image_url: string | null;
};

type FramePreset = {
  id: string;
  label: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
  position: number;
};

/**
 * Asset Library — central hub for reusable creative assets used across
 * invitation templates and events. Currently has two tabs:
 *
 *   • Agenda items     — icon + title + description presets
 *   • Ornamental frames — image (PNG/SVG) or video (MP4/WebM) overlays
 *
 * The active tab is reflected in `?tab=` so links from elsewhere in the
 * admin can deep-link to a specific section.
 */
export default function AssetLibrary() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "frames" ? "frames" : "agenda";

  const setTab = (next: string) => {
    const np = new URLSearchParams(params);
    np.set("tab", next);
    setParams(np, { replace: true });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-gradient-gold flex items-center gap-2">
            <Library className="h-6 w-6" /> Asset Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reusable creative assets shared across templates and events.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="agenda" className="gap-2">
              <ListChecks className="h-4 w-4" /> Agenda items
            </TabsTrigger>
            <TabsTrigger value="frames" className="gap-2">
              <Frame className="h-4 w-4" /> Ornamental frames
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="pt-4">
            <AgendaPresetsManager />
          </TabsContent>

          <TabsContent value="frames" className="pt-4">
            <OrnamentalFramesManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

/* ───────────────────────── Agenda presets ───────────────────────── */

function AgendaPresetsManager() {
  const [presets, setPresets] = useState<AgendaPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<AgendaPreset> | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchPresets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agenda_presets")
      .select("id,label,description,icon,icon_image_url")
      .order("label", { ascending: true });
    if (error) toast.error(error.message);
    setPresets((data ?? []) as AgendaPreset[]);
    setLoading(false);
  };

  useEffect(() => { fetchPresets(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [presets, search]);

  const startNew = () =>
    setEditing({ label: "", description: "", icon: "Sparkle", icon_image_url: null });
  const startEdit = (p: AgendaPreset) => setEditing({ ...p });
  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim()) {
      toast.error("Label is required");
      return;
    }
    const payload = {
      label: editing.label.trim(),
      description: editing.description?.trim() || null,
      icon: editing.icon || "Sparkle",
      icon_image_url: editing.icon_image_url ?? null,
    };
    if (editing.id) {
      const { error } = await supabase.from("agenda_presets").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Preset updated");
    } else {
      const { error } = await supabase.from("agenda_presets").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Preset added");
    }
    setEditing(null);
    fetchPresets();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    const { error } = await supabase.from("agenda_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Preset deleted");
    fetchPresets();
  };

  const uploadIcon = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `agenda-icons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-media")
        .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-media").getPublicUrl(path);
      setEditing((prev) => ({ ...(prev ?? {}), icon_image_url: data.publicUrl }));
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Reusable agenda items (icon + title + description) shared across all events.
        </p>
        {!editing && (
          <Button onClick={startNew}>
            <Plus className="h-4 w-4 mr-2" /> New preset
          </Button>
        )}
        {editing && (
          <Button variant="outline" onClick={cancel}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          <Input placeholder="Search presets…" value={search} onChange={(e) => setSearch(e.target.value)} />

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-md">
              No presets yet. Click "New preset" to add one.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
                  <div className="h-10 w-10 rounded-md border border-border flex items-center justify-center shrink-0 bg-secondary/30">
                    {p.icon_image_url ? (
                      <img src={p.icon_image_url} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.label}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              value={editing.label ?? ""}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. ពិធីក្រុងពលី"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={3}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Short note"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Custom icon (Optional)</Label>
            <div className="border border-dashed border-border rounded-md p-4 flex flex-col items-center gap-3">
              {editing.icon_image_url ? (
                <div className="flex items-center gap-3">
                  <img src={editing.icon_image_url} alt="" className="h-14 w-14 object-contain rounded-md border p-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing({ ...editing, icon_image_url: null })}
                  >
                    <X className="h-4 w-4 mr-1 text-destructive" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">PNG / SVG / JPG recommended (square)</div>
              )}
              <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary/50">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : editing.icon_image_url ? "Change icon" : "Upload icon"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadIcon(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button type="button" onClick={save}>
              {editing.id ? "Save changes" : "Add to library"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Ornamental frames ─────────────────────── */

const FRAME_MAX_BYTES = 12 * 1024 * 1024; // 12 MB ceiling for video frames
const FRAME_THUMB_MAX = 2 * 1024 * 1024;

function detectMediaType(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

function OrnamentalFramesManager() {
  const [frames, setFrames] = useState<FramePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<FramePreset> | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchFrames = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ornamental_frames")
      .select("id,label,media_url,media_type,thumbnail_url,position")
      .order("position", { ascending: true })
      .order("label", { ascending: true });
    if (error) toast.error(error.message);
    setFrames((data ?? []) as FramePreset[]);
    setLoading(false);
  };

  useEffect(() => { fetchFrames(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return frames;
    return frames.filter((f) => f.label.toLowerCase().includes(q));
  }, [frames, search]);

  const startNew = () =>
    setEditing({ label: "", media_url: "", media_type: "image", thumbnail_url: null, position: 0 });
  const startEdit = (f: FramePreset) => setEditing({ ...f });
  const cancel = () => setEditing(null);

  const uploadAsset = async (
    file: File,
    folder: "frames" | "frame-thumbs",
  ): Promise<string | null> => {
    if (!file) return null;
    if (file.size > FRAME_MAX_BYTES) {
      toast.error(`Max ${Math.floor(FRAME_MAX_BYTES / 1024 / 1024)} MB per file`);
      return null;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("event-media")
      .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUploadMedia = async (file: File) => {
    setUploadingMedia(true);
    try {
      const url = await uploadAsset(file, "frames");
      if (!url) return;
      setEditing((prev) => ({
        ...(prev ?? {}),
        media_url: url,
        media_type: detectMediaType(file),
      }));
      toast.success("Frame uploaded");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUploadThumb = async (file: File) => {
    if (file.size > FRAME_THUMB_MAX) { toast.error("Max 2 MB thumbnail"); return; }
    setUploadingThumb(true);
    try {
      const url = await uploadAsset(file, "frame-thumbs");
      if (!url) return;
      setEditing((prev) => ({ ...(prev ?? {}), thumbnail_url: url }));
      toast.success("Thumbnail uploaded");
    } finally {
      setUploadingThumb(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim()) return toast.error("Label is required");
    if (!editing.media_url) return toast.error("Upload a frame file first");
    const payload = {
      label: editing.label.trim(),
      media_url: editing.media_url,
      media_type: editing.media_type ?? "image",
      thumbnail_url: editing.thumbnail_url ?? null,
      position: editing.position ?? 0,
    };
    if (editing.id) {
      const { error } = await (supabase as any)
        .from("ornamental_frames").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Frame updated");
    } else {
      const { error } = await (supabase as any).from("ornamental_frames").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Frame added");
    }
    setEditing(null);
    fetchFrames();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this frame?")) return;
    const { error } = await (supabase as any).from("ornamental_frames").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Frame deleted");
    fetchFrames();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Decorative PNG/SVG <em>or</em> MP4/WebM overlays with a transparent center.
          Use these to frame the cover and invitation in templates like Signature Package.
        </p>
        {!editing && (
          <Button onClick={startNew}>
            <Plus className="h-4 w-4 mr-2" /> New frame
          </Button>
        )}
        {editing && (
          <Button variant="outline" onClick={cancel}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          <Input placeholder="Search frames…" value={search} onChange={(e) => setSearch(e.target.value)} />

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-md">
              No frames yet. Click "New frame" to add one.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((f) => (
                <div key={f.id} className="rounded-md border border-border bg-card overflow-hidden flex flex-col">
                  <div className="aspect-[3/4] bg-[conic-gradient(at_top_left,_#f3f3f3_25%,_#e5e5e5_25%_50%,_#f3f3f3_50%_75%,_#e5e5e5_75%)] [background-size:14px_14px] flex items-center justify-center">
                    <FramePreview frame={f} className="h-full w-full object-contain" />
                  </div>
                  <div className="p-3 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{f.label}</div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {f.media_type}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(f)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(f.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={editing.label ?? ""}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. Floral Gold"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Frame file (PNG/SVG/MP4/WebM)</Label>
              <div className="border border-dashed border-border rounded-md p-3 flex flex-col items-center gap-2">
                {editing.media_url ? (
                  <div className="w-full aspect-[3/4] bg-[conic-gradient(at_top_left,_#f3f3f3_25%,_#e5e5e5_25%_50%,_#f3f3f3_50%_75%,_#e5e5e5_75%)] [background-size:14px_14px] rounded">
                    <FramePreview
                      frame={editing as FramePreset}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-8">No file yet</div>
                )}
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary/50">
                  <Upload className="h-4 w-4" />
                  {uploadingMedia ? "Uploading…" : (editing.media_url ? "Replace file" : "Upload file")}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp,video/mp4,video/webm"
                    className="hidden"
                    disabled={uploadingMedia}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadMedia(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {editing.media_url && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setEditing({ ...editing, media_url: "", media_type: "image" })}
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground text-center">
                  Recommended: portrait, transparent center. Max 12 MB.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Optional thumbnail (PNG/JPG)</Label>
              <div className="border border-dashed border-border rounded-md p-3 flex flex-col items-center gap-2">
                {editing.thumbnail_url ? (
                  <img src={editing.thumbnail_url} alt="" className="h-24 w-auto object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground py-8">
                    Used in pickers when video frames are slow to render.
                  </div>
                )}
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary/50">
                  <Upload className="h-4 w-4" />
                  {uploadingThumb ? "Uploading…" : "Upload thumbnail"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingThumb}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadThumb(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {editing.thumbnail_url && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setEditing({ ...editing, thumbnail_url: null })}
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button type="button" onClick={save}>
              {editing.id ? "Save changes" : "Add to library"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders a frame asset — `<video>` for video frames, `<img>` otherwise. */
export function FramePreview({
  frame,
  className,
  videoProps,
}: {
  frame: Pick<FramePreset, "media_url" | "media_type" | "thumbnail_url">;
  className?: string;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
}) {
  if (!frame?.media_url) return null;
  if (frame.media_type === "video") {
    return (
      <video
        src={frame.media_url}
        poster={frame.thumbnail_url ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        className={className}
        {...videoProps}
      />
    );
  }
  return <img src={frame.thumbnail_url || frame.media_url} alt="" className={className} />;
}
