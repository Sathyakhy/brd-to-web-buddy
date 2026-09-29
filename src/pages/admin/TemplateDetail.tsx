import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, Sparkles, AlertCircle, Upload, Trash2, Image as ImageIcon, GripVertical, Check, Music, Type as TypeIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import LetterCardStyleEditor from "@/components/admin/LetterCardStyleEditor";
import ElementStyleEditor from "@/components/admin/ElementStyleEditor";
import CoverInvitationStyleEditor from "@/components/admin/CoverInvitationStyleEditor";
import {
  CoverInvitationStyle,
  normalizeCoverInvitationStyle,
} from "@/lib/coverInvitationStyle";
import RsvpCardStyleEditor from "@/components/admin/RsvpCardStyleEditor";
import MusicEditor from "@/components/admin/MusicEditor";
import PreviewPanel from "@/components/admin/PreviewPanel";
import FrameLibraryPicker from "@/components/admin/FrameLibraryPicker";
import ParentsEditor from "@/components/admin/ParentsEditor";
import AgendaEditor from "@/components/admin/AgendaEditor";
import ContactsEditor from "@/components/admin/ContactsEditor";
import SortableGalleryItem from "@/components/admin/SortableGalleryItem";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { AgendaDay, AgendaViewStyle, normalizeAgenda } from "@/lib/agenda";
import { ContactItem, normalizeContacts } from "@/lib/contacts";
import SectionVisibilityEditor from "@/components/admin/SectionVisibilityEditor";
import { normalizeVisibility, SectionVisibility } from "@/lib/sectionVisibility";
import TextEffectsEditor from "@/components/admin/TextEffectsEditor";
import MonogramEffectEditor from "@/components/admin/MonogramEffectEditor";
import FontSelector from "@/components/admin/FontSelector";
import SideFrameEditor from "@/components/admin/SideFrameEditor";
import {
  SideFrameConfig,
  normalizeSideFrameConfig,
} from "@/lib/sideFrame";
import {
  normalizeTextEffectConfig,
  type TextEffectConfig,
} from "@/lib/textEffects";
import { normalizeMusicSettings } from "@/lib/musicSettings";
import {
  EnvelopeUnboxingConfig,
  normalizeEnvelopeConfig,
} from "@/lib/envelopeUnboxing";
import EnvelopeUnboxingEditor from "@/components/admin/EnvelopeUnboxingEditor";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy,
} from "@dnd-kit/sortable";

// Configuration shape used by the preview / dummy data. Matches the subset of
// the events table that affects rendering, plus a sample guest name for the
// preview's gate screen.
type TemplateConfig = {
  title: string;
  cover_message: string | null;
  countdown_message: string | null;
  description: string | null;
  venue: string | null;
  reception_title?: string | null;
  details_message?: string | null;
  rsvp_title?: string | null;
  rsvp_title_en?: string | null;
  cover_image_url: string | null;
  cover_background_url: string | null;
  invite_background_url: string | null;
  gallery_urls: string[];
  gallery_layout: "grid" | "mosaic";
  /** Date-only ISO string (YYYY-MM-DD) used for the live preview countdown. */
  event_date: string | null;
  contact_phone: string | null;
  bride_name: string | null;
  groom_name: string | null;
  agenda_days: AgendaDay[];
  agenda_view_style: AgendaViewStyle;
  contacts: ContactItem[];
  map_embed: string | null;
  text_color_primary: string | null;
  text_color_accent: string | null;
  open_button_color: string | null;
  text_effect_config?: TextEffectConfig;
  sample_guest_name: string;
  /** Default section visibility — events can override per-event. */
  section_visibility: SectionVisibility;
  /** Optional uploaded QR code image (gift transfer). */
  qr_code_url: string | null;
  /** Default description shown above the QR. */
  qr_code_message: string | null;
  /** Default account holder name shown under the QR. */
  qr_account_name: string | null;
  /** Default apologies letter body. */
  apologies_message: string | null;
  /** Default thank-you letter body. */
  thank_you_message: string | null;
  /** Background color (hex) for the Apologies / Thank-you letter cards. */
  letter_bg_color: string | null;
  /** Opacity (0–100) for the letter card background. */
  letter_bg_opacity: number | null;
  /** Background color (hex) for the Agenda card. */
  agenda_bg_color?: string | null;
  /** Opacity (0–100) for the agenda card background. */
  agenda_bg_opacity?: number | null;
  /** Custom asset color (hex) for agenda icons, dividers, day badges, and timeline accents. */
  agenda_asset_color?: string | null;
  map_button_bg_color?: string | null;
  map_button_bg_opacity?: number | null;
  countdown_bg_color?: string | null;
  countdown_bg_opacity?: number | null;
  rsvp_bg_color?: string | null;
  rsvp_bg_opacity?: number | null;
  rsvp_header_font?: string | null;
  rsvp_header_font_en?: string | null;
  rsvp_body_font?: string | null;
  rsvp_body_font_en?: string | null;
  rsvp_header_effect?: string | null;
  rsvp_header_effect_color?: string | null;
  rsvp_header_effect_blur?: number | null;
  rsvp_header_effect_x?: number | null;
  rsvp_header_effect_y?: number | null;
  rsvp_header_effect_opacity?: number | null;
  rsvp_card_shadow_type?: string | null;
  rsvp_card_shadow_color?: string | null;
  rsvp_card_shadow_blur?: number | null;
  rsvp_card_shadow_spread?: number | null;
  rsvp_card_shadow_x?: number | null;
  rsvp_card_shadow_y?: number | null;
  rsvp_card_shadow_opacity?: number | null;
  cover_invitation_style?: CoverInvitationStyle;
  /** Optional ornamental frame overlay (Signature Package). PNG/SVG with
      transparent center, OR a video (MP4/WebM) — chosen from the Asset
      Library and identified by URL. `frame_type` tells the renderer
      whether to draw an `<img>` or `<video>`. */
  frame_url: string | null;
  frame_type: "image" | "video";
  /** Ornamental frame on the side of the screen configuration. */
  side_frame_config?: SideFrameConfig;
  /** Interactive 3D Envelope Unboxing default configuration */
  envelope_unboxing?: EnvelopeUnboxingConfig;
  /** Optional default cover music track (Signature Package). Plays on the
      cover/gate screen with a toggle; per-event override lives on the
      event row. */
  header_font?: string | null;
  header_font_km?: string | null;
  header_font_en?: string | null;
  body_font?: string | null;
  body_font_km?: string | null;
  body_font_en?: string | null;
  cover_music_url: string | null;
  /** Whether music should auto-play on the cover screen by default */
  music_autoplay_cover?: boolean;
  /** Whether music should auto-play on the invitation page by default */
  music_autoplay_invitation?: boolean;
  /** Music autoplay mode string: "cover" | "invitation" | "both" | "none" */
  music_autoplay_mode?: string;
};

type TemplateRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  base_renderer: string;
  is_active: boolean;
  position: number;
  config: any;
};

const RENDERERS = [
  { value: "essentials-package-01", label: "essentials-package-01" },
  { value: "signature-package-01", label: "signature-package-01" },
];

const DEFAULT_CONFIG: TemplateConfig = {
  title: "Wedding Reception",
  cover_message: null,
  countdown_message: null,
  description: null,
  venue: null,
  cover_image_url: null,
  cover_background_url: null,
  invite_background_url: null,
  gallery_urls: [],
  gallery_layout: "grid",
  event_date: null,
  contact_phone: "+855 ",
  bride_name: "លោក|ជា|ស៊ីណា\nលោកស្រី|ស៊ឹម|សុខុម\nជា|វ៉ាន់នី",
  groom_name: "លោក|កែវ|វីរៈ\nលោកស្រី|សោម|សុខា\nកែវ|ពិសិដ្ឋ",
  agenda_days: [],
  agenda_view_style: "list",
  contacts: [],
  map_embed: null,
  text_color_primary: null,
  text_color_accent: null,
  open_button_color: null,
  sample_guest_name: "Honoured Guest",
  section_visibility: {},
  qr_code_url: null,
  qr_code_message: null,
  qr_account_name: null,
  apologies_message: null,
  thank_you_message: null,
  letter_bg_color: null,
  letter_bg_opacity: null,
  agenda_bg_color: null,
  agenda_bg_opacity: null,
  agenda_asset_color: null,
  map_button_bg_color: null,
  map_button_bg_opacity: null,
  countdown_bg_color: null,
  countdown_bg_opacity: null,
  rsvp_bg_color: null,
  rsvp_bg_opacity: null,
  rsvp_header_font: null,
  rsvp_header_font_en: null,
  rsvp_body_font: null,
  rsvp_body_font_en: null,
  rsvp_header_effect: null,
  rsvp_header_effect_color: null,
  rsvp_header_effect_blur: null,
  rsvp_header_effect_x: null,
  rsvp_header_effect_y: null,
  rsvp_header_effect_opacity: null,
  rsvp_card_shadow_type: null,
  rsvp_card_shadow_color: null,
  rsvp_card_shadow_blur: null,
  rsvp_card_shadow_spread: null,
  rsvp_card_shadow_x: null,
  rsvp_card_shadow_y: null,
  rsvp_card_shadow_opacity: null,
  frame_url: null,
  frame_type: "image",
  side_frame_config: normalizeSideFrameConfig(null),
  envelope_unboxing: normalizeEnvelopeConfig(null),
  header_font: null,
  header_font_km: null,
  header_font_en: null,
  body_font: null,
  body_font_km: null,
  body_font_en: null,
  cover_music_url: null,
  music_autoplay_cover: true,
  music_autoplay_invitation: true,
  music_autoplay_mode: "both",
};

// Normalize whatever JSON we get back into a fully-typed TemplateConfig so the
// editor never has to deal with partial/legacy shapes.
function normalizeConfig(raw: any): TemplateConfig {
  const r = raw ?? {};
  const musicSettings = normalizeMusicSettings({
    autoPlayCover: r.music_autoplay_cover ?? r.section_visibility?.music_autoplay_cover,
    autoPlayInvitation: r.music_autoplay_invitation ?? r.section_visibility?.music_autoplay_invitation,
    music_autoplay_mode: r.music_autoplay_mode ?? r.section_visibility?.music_autoplay_mode,
  });
  return {
    ...DEFAULT_CONFIG,
    ...r,
    header_font: r.header_font ?? r.section_visibility?.header_font ?? null,
    header_font_km: r.header_font_km ?? r.section_visibility?.header_font_km ?? r.header_font ?? null,
    header_font_en: r.header_font_en ?? r.section_visibility?.header_font_en ?? null,
    body_font: r.body_font ?? r.section_visibility?.body_font ?? null,
    body_font_km: r.body_font_km ?? r.section_visibility?.body_font_km ?? r.body_font ?? null,
    body_font_en: r.body_font_en ?? r.section_visibility?.body_font_en ?? null,
    agenda_bg_color: r.agenda_bg_color ?? r.section_visibility?.agenda_style?.bg_color ?? r.section_visibility?.agenda_bg_color ?? null,
    agenda_bg_opacity: r.agenda_bg_opacity ?? r.section_visibility?.agenda_style?.bg_opacity ?? r.section_visibility?.agenda_bg_opacity ?? null,
    agenda_asset_color: r.agenda_asset_color ?? r.section_visibility?.agenda_style?.asset_color ?? r.section_visibility?.agenda_asset_color ?? null,
    map_button_bg_color: r.map_button_bg_color ?? r.section_visibility?.map_button_bg_color ?? null,
    map_button_bg_opacity: typeof r.map_button_bg_opacity === "number" ? r.map_button_bg_opacity : (typeof r.section_visibility?.map_button_bg_opacity === "number" ? r.section_visibility?.map_button_bg_opacity : null),
    countdown_bg_color: r.countdown_bg_color ?? r.section_visibility?.countdown_bg_color ?? null,
    countdown_bg_opacity: typeof r.countdown_bg_opacity === "number" ? r.countdown_bg_opacity : (typeof r.section_visibility?.countdown_bg_opacity === "number" ? r.section_visibility?.countdown_bg_opacity : null),
    rsvp_title: r.rsvp_title ?? r.section_visibility?.rsvp_title ?? r.section_visibility?.rsvp_style?.rsvp_title ?? null,
    rsvp_title_en: r.rsvp_title_en ?? r.section_visibility?.rsvp_title_en ?? r.section_visibility?.rsvp_style?.rsvp_title_en ?? null,
    rsvp_bg_color: r.rsvp_bg_color ?? r.section_visibility?.rsvp_bg_color ?? r.section_visibility?.rsvp_style?.bg_color ?? null,
    rsvp_bg_opacity: typeof r.rsvp_bg_opacity === "number" ? r.rsvp_bg_opacity : (typeof r.section_visibility?.rsvp_bg_opacity === "number" ? r.section_visibility?.rsvp_bg_opacity : (typeof r.section_visibility?.rsvp_style?.bg_opacity === "number" ? r.section_visibility?.rsvp_style?.bg_opacity : null)),
    rsvp_header_font: r.rsvp_header_font ?? r.section_visibility?.rsvp_header_font ?? r.section_visibility?.rsvp_style?.header_font ?? null,
    rsvp_header_font_en: r.rsvp_header_font_en ?? r.section_visibility?.rsvp_header_font_en ?? r.section_visibility?.rsvp_style?.header_font_en ?? null,
    rsvp_body_font: r.rsvp_body_font ?? r.section_visibility?.rsvp_body_font ?? r.section_visibility?.rsvp_style?.body_font ?? null,
    rsvp_body_font_en: r.rsvp_body_font_en ?? r.section_visibility?.rsvp_body_font_en ?? r.section_visibility?.rsvp_style?.body_font_en ?? null,
    rsvp_header_effect: r.rsvp_header_effect ?? r.section_visibility?.rsvp_header_effect ?? r.section_visibility?.rsvp_style?.header_effect ?? null,
    rsvp_header_effect_color: r.rsvp_header_effect_color ?? r.section_visibility?.rsvp_header_effect_color ?? r.section_visibility?.rsvp_style?.header_effect_color ?? null,
    rsvp_header_effect_blur: typeof r.rsvp_header_effect_blur === "number" ? r.rsvp_header_effect_blur : (typeof r.section_visibility?.rsvp_header_effect_blur === "number" ? r.section_visibility?.rsvp_header_effect_blur : (typeof r.section_visibility?.rsvp_style?.header_effect_blur === "number" ? r.section_visibility?.rsvp_style?.header_effect_blur : null)),
    rsvp_header_effect_x: typeof r.rsvp_header_effect_x === "number" ? r.rsvp_header_effect_x : (typeof r.section_visibility?.rsvp_header_effect_x === "number" ? r.section_visibility?.rsvp_header_effect_x : (typeof r.section_visibility?.rsvp_style?.header_effect_x === "number" ? r.section_visibility?.rsvp_style?.header_effect_x : null)),
    rsvp_header_effect_y: typeof r.rsvp_header_effect_y === "number" ? r.rsvp_header_effect_y : (typeof r.section_visibility?.rsvp_header_effect_y === "number" ? r.section_visibility?.rsvp_header_effect_y : (typeof r.section_visibility?.rsvp_style?.header_effect_y === "number" ? r.section_visibility?.rsvp_style?.header_effect_y : null)),
    rsvp_header_effect_opacity: typeof r.rsvp_header_effect_opacity === "number" ? r.rsvp_header_effect_opacity : (typeof r.section_visibility?.rsvp_header_effect_opacity === "number" ? r.section_visibility?.rsvp_header_effect_opacity : (typeof r.section_visibility?.rsvp_style?.header_effect_opacity === "number" ? r.section_visibility?.rsvp_style?.header_effect_opacity : null)),
    rsvp_card_shadow_type: r.rsvp_card_shadow_type ?? r.section_visibility?.rsvp_card_shadow_type ?? r.section_visibility?.rsvp_style?.card_shadow_type ?? null,
    rsvp_card_shadow_color: r.rsvp_card_shadow_color ?? r.section_visibility?.rsvp_card_shadow_color ?? r.section_visibility?.rsvp_style?.card_shadow_color ?? null,
    rsvp_card_shadow_blur: typeof r.rsvp_card_shadow_blur === "number" ? r.rsvp_card_shadow_blur : (typeof r.section_visibility?.rsvp_card_shadow_blur === "number" ? r.section_visibility?.rsvp_card_shadow_blur : (typeof r.section_visibility?.rsvp_style?.card_shadow_blur === "number" ? r.section_visibility?.rsvp_style?.card_shadow_blur : null)),
    rsvp_card_shadow_spread: typeof r.rsvp_card_shadow_spread === "number" ? r.rsvp_card_shadow_spread : (typeof r.section_visibility?.rsvp_card_shadow_spread === "number" ? r.section_visibility?.rsvp_card_shadow_spread : (typeof r.section_visibility?.rsvp_style?.card_shadow_spread === "number" ? r.section_visibility?.rsvp_style?.card_shadow_spread : null)),
    rsvp_card_shadow_x: typeof r.rsvp_card_shadow_x === "number" ? r.rsvp_card_shadow_x : (typeof r.section_visibility?.rsvp_card_shadow_x === "number" ? r.section_visibility?.rsvp_card_shadow_x : (typeof r.section_visibility?.rsvp_style?.card_shadow_x === "number" ? r.section_visibility?.rsvp_style?.card_shadow_x : null)),
    rsvp_card_shadow_y: typeof r.rsvp_card_shadow_y === "number" ? r.rsvp_card_shadow_y : (typeof r.section_visibility?.rsvp_card_shadow_y === "number" ? r.section_visibility?.rsvp_card_shadow_y : (typeof r.section_visibility?.rsvp_style?.card_shadow_y === "number" ? r.section_visibility?.rsvp_style?.card_shadow_y : null)),
    rsvp_card_shadow_opacity: typeof r.rsvp_card_shadow_opacity === "number" ? r.rsvp_card_shadow_opacity : (typeof r.section_visibility?.rsvp_card_shadow_opacity === "number" ? r.section_visibility?.rsvp_card_shadow_opacity : (typeof r.section_visibility?.rsvp_style?.card_shadow_opacity === "number" ? r.section_visibility?.rsvp_style?.card_shadow_opacity : null)),
    music_autoplay_cover: musicSettings.autoPlayCover,
    music_autoplay_invitation: musicSettings.autoPlayInvitation,
    music_autoplay_mode: r.music_autoplay_mode ?? (musicSettings.autoPlayCover && musicSettings.autoPlayInvitation ? "both" : musicSettings.autoPlayCover ? "cover" : musicSettings.autoPlayInvitation ? "invitation" : "none"),
    gallery_urls: Array.isArray(r.gallery_urls) ? r.gallery_urls : [],
    gallery_layout: r.gallery_layout === "mosaic" ? "mosaic" : "grid",
    event_date: r.event_date ?? null,
    agenda_days: normalizeAgenda(r.agenda_days),
    agenda_view_style: r.agenda_view_style === "card" ? "card" : "list",
    contacts: normalizeContacts(r.contacts),
    sample_guest_name: r.sample_guest_name || "Honoured Guest",
    contact_phone: r.contact_phone ?? "+855 ",
    section_visibility: normalizeVisibility(r.section_visibility),
    open_button_color: r.open_button_color ?? null,
    cover_invitation_style: normalizeCoverInvitationStyle(r.cover_invitation_style ?? r.section_visibility?.cover_invitation_style ?? r.section_visibility?.cover_invitation),
    text_effect_config: normalizeTextEffectConfig(r.text_effect_config ?? r.text_effects),
    side_frame_config: normalizeSideFrameConfig(r.side_frame_config ?? r.section_visibility?.side_frame_config ?? r.side_frame),
    envelope_unboxing: normalizeEnvelopeConfig(r.envelope_unboxing ?? r.section_visibility?.envelope_unboxing),
  };
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Server snapshot vs working draft — same pattern as the billing editor so
  // edits are local until the user clicks Save.
  const [server, setServer] = useState<TemplateRow | null>(null);
  const [draft, setDraft] = useState<TemplateRow | null>(null);
  const [draftConfig, setDraftConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
  const [serverConfig, setServerConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Per-kind upload progress (0–100). When a key is present the UI shows the
  // bar; absent means idle. We use XMLHttpRequest to get real progress events
  // since the supabase-js storage client doesn't expose them.
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const uploading = Object.keys(uploadProgress).length > 0;

  // Helper to patch the working config copy. Defined early so the upload
  // handlers below can use it.
  const patchConfig = (patch: Partial<TemplateConfig>) =>
    setDraftConfig(prev => ({ ...prev, ...patch }));

  /**
   * Upload a single image to the shared `event-media` bucket under a
   * `template/<templateId>/...` prefix. Reports progress via the supplied
   * `onProgress` callback (0–100).
   */
  const uploadImage = async (
    file: File,
    kind: "cover" | "cover-bg" | "invite-bg" | "gallery" | "qr" | "frame" | "audio",
    onProgress?: (pct: number) => void,
  ): Promise<string | null> => {
    if (!id) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `template/${id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // Use XHR against the storage REST endpoint so we can stream upload progress.
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/event-media/${path}`;
    const ok = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token ?? ""}`);
      xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("cache-control", "31536000");
      if (file.type) xhr.setRequestHeader("content-type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve(true); }
        else { try { toast.error(JSON.parse(xhr.responseText).message ?? "Upload failed"); } catch { toast.error("Upload failed"); } resolve(false); }
      };
      xhr.onerror = () => { toast.error("Upload failed"); resolve(false); };
      xhr.send(file);
    });
    if (!ok) return null;
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const runUpload = async (
    key: string,
    file: File,
    kind: "cover" | "cover-bg" | "invite-bg" | "gallery" | "qr" | "frame" | "audio",
  ) => {
    setUploadProgress((p) => ({ ...p, [key]: 0 }));
    const url = await uploadImage(file, kind, (pct) =>
      setUploadProgress((p) => ({ ...p, [key]: pct })),
    );
    setUploadProgress((p) => { const n = { ...p }; delete n[key]; return n; });
    return url;
  };

  const handleUploadQr = async (file: File) => {
    const url = await runUpload("qr", file, "qr");
    if (url) { patchConfig({ qr_code_url: url }); toast.success("QR code uploaded"); }
  };

  const handleUploadCover = async (file: File) => {
    const url = await runUpload("cover", file, "cover");
    if (url) { patchConfig({ cover_image_url: url }); toast.success("Cover image uploaded"); }
  };

  const handleUploadCoverBg = async (file: File) => {
    const url = await runUpload("cover-bg", file, "cover-bg");
    if (url) { patchConfig({ cover_background_url: url }); toast.success("Background uploaded"); }
  };

  const handleUploadInviteBg = async (file: File) => {
    const url = await runUpload("invite-bg", file, "invite-bg");
    if (url) { patchConfig({ invite_background_url: url }); toast.success("Invitation background uploaded"); }
  };

  // Note: ornamental frames are no longer uploaded directly here. Admins
  // pick from the centralised Asset Library (`/admin/asset-library?tab=frames`).


  const handleUploadMusic = async (file: File) => {
    const MAX = 8 * 1024 * 1024;
    if (file.size > MAX) { toast.error("Max 8 MB audio file"); return null; }
    const url = await runUpload("audio", file, "audio");
    if (url) { patchConfig({ cover_music_url: url }); toast.success("Cover music uploaded"); }
    return url;
  };

  const handleUploadGallery = async (files: FileList) => {
    const MAX_BYTES = 5 * 1024 * 1024;
    const current = draftConfig.gallery_urls ?? [];
    const remaining = 24 - current.length;
    if (remaining <= 0) { toast.error("Gallery is full (24 images max)"); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      if (file.size > MAX_BYTES) { toast.error(`${file.name}: max 5 MB`); continue; }
      const url = await runUpload(`gallery-${i}-${file.name}`, file, "gallery");
      if (url) uploaded.push(url);
    }
    if (uploaded.length) {
      patchConfig({ gallery_urls: [...current, ...uploaded] });
      toast.success(`Uploaded ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""}`);
    }
  };

  const removeGalleryImage = (idx: number) => {
    const next = (draftConfig.gallery_urls ?? []).filter((_, i) => i !== idx);
    patchConfig({ gallery_urls: next });
  };

  const gallerySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onGalleryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const urls = draftConfig.gallery_urls ?? [];
    const ids = urls.map((_, i) => `g-${i}`);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    patchConfig({ gallery_urls: arrayMove(urls, from, to) });
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) toast.error(error.message);
    if (!data) {
      setServer(null);
      setLoading(false);
      return;
    }
    const row = data as TemplateRow;
    const cfg = normalizeConfig(row.config);
    setServer(row);
    setDraft({ ...row });
    setServerConfig(cfg);
    setDraftConfig(cfg);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  // Dirty when metadata or config differ from the loaded snapshot.
  const dirty = useMemo(() => {
    if (loading || !draft || !server) return false;
    if (
      draft.label !== server.label ||
      (draft.description ?? "") !== (server.description ?? "") ||
      draft.slug !== server.slug ||
      draft.base_renderer !== server.base_renderer ||
      draft.is_active !== server.is_active
    ) return true;
    // Cheap structural compare — JSON.stringify is fine for our shape.
    return JSON.stringify(draftConfig) !== JSON.stringify(serverConfig);
  }, [loading, draft, server, draftConfig, serverConfig]);

  useUnsavedChanges(dirty);

  /**
   * Persist the current draft. We `select()` after the update so the response
   * carries the canonical row — avoids a read-after-write replica race where a
   * follow-up `select` could return the stale pre-update snapshot and make the
   * editor look like the save didn't take effect.
   */
  const handleSave = async () => {
    if (!draft || !dirty || saving) return;
    setSaving(true);
    const nextVis = {
      ...(draftConfig.section_visibility as any),
      map_button_bg_color: draftConfig.map_button_bg_color ?? null,
      map_button_bg_opacity: draftConfig.map_button_bg_opacity ?? null,
      countdown_bg_color: draftConfig.countdown_bg_color ?? null,
      countdown_bg_opacity: draftConfig.countdown_bg_opacity ?? null,
      rsvp_style: {
        bg_color: draftConfig.rsvp_bg_color ?? null,
        bg_opacity: draftConfig.rsvp_bg_opacity ?? null,
        header_font: draftConfig.rsvp_header_font ?? null,
        header_font_en: draftConfig.rsvp_header_font_en ?? null,
        body_font: draftConfig.rsvp_body_font ?? null,
        body_font_en: draftConfig.rsvp_body_font_en ?? null,
        header_effect: draftConfig.rsvp_header_effect ?? "default",
        header_effect_color: draftConfig.rsvp_header_effect_color ?? null,
        header_effect_blur: draftConfig.rsvp_header_effect_blur ?? null,
        header_effect_x: draftConfig.rsvp_header_effect_x ?? null,
        header_effect_y: draftConfig.rsvp_header_effect_y ?? null,
        header_effect_opacity: draftConfig.rsvp_header_effect_opacity ?? null,
        card_shadow_type: draftConfig.rsvp_card_shadow_type ?? "default",
        card_shadow_color: draftConfig.rsvp_card_shadow_color ?? null,
        card_shadow_blur: draftConfig.rsvp_card_shadow_blur ?? null,
        card_shadow_spread: draftConfig.rsvp_card_shadow_spread ?? null,
        card_shadow_x: draftConfig.rsvp_card_shadow_x ?? null,
        card_shadow_y: draftConfig.rsvp_card_shadow_y ?? null,
        card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity ?? null,
      },
      rsvp_bg_color: draftConfig.rsvp_bg_color ?? null,
      rsvp_bg_opacity: draftConfig.rsvp_bg_opacity ?? null,
      rsvp_header_font: draftConfig.rsvp_header_font ?? null,
      rsvp_header_font_en: draftConfig.rsvp_header_font_en ?? null,
      rsvp_body_font: draftConfig.rsvp_body_font ?? null,
      rsvp_body_font_en: draftConfig.rsvp_body_font_en ?? null,
      rsvp_header_effect: draftConfig.rsvp_header_effect ?? null,
      rsvp_header_effect_color: draftConfig.rsvp_header_effect_color ?? null,
      rsvp_header_effect_blur: draftConfig.rsvp_header_effect_blur ?? null,
      rsvp_header_effect_x: draftConfig.rsvp_header_effect_x ?? null,
      rsvp_header_effect_y: draftConfig.rsvp_header_effect_y ?? null,
      rsvp_header_effect_opacity: draftConfig.rsvp_header_effect_opacity ?? null,
      rsvp_card_shadow_type: draftConfig.rsvp_card_shadow_type ?? null,
      rsvp_card_shadow_color: draftConfig.rsvp_card_shadow_color ?? null,
      rsvp_card_shadow_blur: draftConfig.rsvp_card_shadow_blur ?? null,
      rsvp_card_shadow_spread: draftConfig.rsvp_card_shadow_spread ?? null,
      rsvp_card_shadow_x: draftConfig.rsvp_card_shadow_x ?? null,
      rsvp_card_shadow_y: draftConfig.rsvp_card_shadow_y ?? null,
      rsvp_card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity ?? null,
    };
    const payload = {
      label: draft.label.trim() || "Untitled template",
      description: draft.description?.trim() || null,
      slug: draft.slug.trim(),
      base_renderer: draft.base_renderer,
      is_active: draft.is_active,
      config: {
        ...draftConfig,
        section_visibility: nextVis,
      } as any,
    };
    // Two-step: update without single(), then re-fetch the canonical row.
    // Using .single() on the update can throw "Cannot coerce the result to a
    // single JSON object" when PostgREST returns 0 rows (e.g. RLS filters the
    // returned row even though the write succeeded). Splitting avoids that.
    const { error: updateError } = await supabase
      .from("templates")
      .update(payload)
      .eq("id", draft.id);
    if (updateError) {
      setSaving(false);
      return toast.error(updateError.message);
    }
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", draft.id)
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Saved, but couldn't reload the template.");
    const row = data as TemplateRow;
    const cfg = normalizeConfig(row.config);
    setServer(row);
    setDraft(row);
    setServerConfig(cfg);
    setDraftConfig(cfg);
    toast.success("Template saved");
  };

  const handleDiscard = () => {
    if (!dirty || !server) return;
    if (!window.confirm("Discard all unsaved template changes?")) return;
    setDraft({ ...server });
    setDraftConfig(serverConfig);
  };

  if (loading || !draft) {
    return (
      <AdminLayout>
        <div className="text-center text-sm text-muted-foreground py-12">
          {loading ? "Loading…" : (
            <>
              <p className="mb-4">Template not found.</p>
              <Link to="/admin/templates"><Button variant="outline">Back to templates</Button></Link>
            </>
          )}
        </div>
      </AdminLayout>
    );
  }

  // Reusable per-section save button shown in each CollapsibleSection's right
  // slot. It triggers the same full-template save (the row is small enough
  // that there's no benefit to a partial update) and reflects dirty/saving
  // state so the user gets immediate feedback inline with the section.
  const sectionSave = (
    <Button
      size="sm"
      variant={dirty ? "default" : "ghost"}
      onClick={(e) => { e.stopPropagation(); handleSave(); }}
      disabled={!dirty || saving}
      className={dirty ? "bg-gradient-gold text-primary-foreground hover:opacity-90" : ""}
    >
      {saving ? (
        <>Saving…</>
      ) : dirty ? (
        <><Save className="h-3.5 w-3.5 mr-1" /> Save</>
      ) : (
        <><Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Saved</>
      )}
    </Button>
  );

  /** Inline upload progress bar — shown while a file is in flight. */
  const uploadBar = (key: string) =>
    uploadProgress[key] !== undefined ? (
      <div className="space-y-1">
        <Progress value={uploadProgress[key]} className="h-2" />
        <p className="text-[11px] text-muted-foreground">
          Uploading… {uploadProgress[key]}%
        </p>
      </div>
    ) : null;

  // Build a synthetic "event" object that the PreviewPanel can render with —
  // exactly the same shape the live preview uses on the event page. The
  // event_date drives the countdown — falls back to a future date so the
  // countdown still looks sensible when no date has been entered yet.
  const previewEvent = {
    ...draftConfig,
    template: draft.base_renderer,
    slug: draft.slug,
    event_date: draftConfig.event_date
      ? new Date(`${draftConfig.event_date}T00:00:00`).toISOString()
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    // Feed visibility into the preview the same way the live invite does.
    envelope_unboxing: draftConfig.envelope_unboxing,
    template_envelope_unboxing: draftConfig.envelope_unboxing,
    map_button_bg_color: draftConfig.map_button_bg_color ?? null,
    map_button_bg_opacity: draftConfig.map_button_bg_opacity ?? null,
    countdown_bg_color: draftConfig.countdown_bg_color ?? null,
    countdown_bg_opacity: draftConfig.countdown_bg_opacity ?? null,
    rsvp_bg_color: draftConfig.rsvp_bg_color ?? null,
    rsvp_bg_opacity: draftConfig.rsvp_bg_opacity ?? null,
    rsvp_header_font: draftConfig.rsvp_header_font ?? null,
    rsvp_header_font_en: draftConfig.rsvp_header_font_en ?? null,
    rsvp_body_font: draftConfig.rsvp_body_font ?? null,
    rsvp_body_font_en: draftConfig.rsvp_body_font_en ?? null,
    rsvp_header_effect: draftConfig.rsvp_header_effect ?? null,
    rsvp_header_effect_color: draftConfig.rsvp_header_effect_color ?? null,
    rsvp_header_effect_blur: draftConfig.rsvp_header_effect_blur ?? null,
    rsvp_header_effect_x: draftConfig.rsvp_header_effect_x ?? null,
    rsvp_header_effect_y: draftConfig.rsvp_header_effect_y ?? null,
    rsvp_header_effect_opacity: draftConfig.rsvp_header_effect_opacity ?? null,
    rsvp_card_shadow_type: draftConfig.rsvp_card_shadow_type ?? null,
    rsvp_card_shadow_color: draftConfig.rsvp_card_shadow_color ?? null,
    rsvp_card_shadow_blur: draftConfig.rsvp_card_shadow_blur ?? null,
    rsvp_card_shadow_spread: draftConfig.rsvp_card_shadow_spread ?? null,
    rsvp_card_shadow_x: draftConfig.rsvp_card_shadow_x ?? null,
    rsvp_card_shadow_y: draftConfig.rsvp_card_shadow_y ?? null,
    rsvp_card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity ?? null,
    template_section_visibility: {
      ...(draftConfig.section_visibility as any),
      agenda_style: {
        bg_color: draftConfig.agenda_bg_color ?? null,
        bg_opacity: draftConfig.agenda_bg_opacity ?? null,
        asset_color: draftConfig.agenda_asset_color ?? null,
      },
      agenda_bg_color: draftConfig.agenda_bg_color ?? null,
      agenda_bg_opacity: draftConfig.agenda_bg_opacity ?? null,
      agenda_asset_color: draftConfig.agenda_asset_color ?? null,
      map_button_bg_color: draftConfig.map_button_bg_color ?? null,
      map_button_bg_opacity: draftConfig.map_button_bg_opacity ?? null,
      countdown_bg_color: draftConfig.countdown_bg_color ?? null,
      countdown_bg_opacity: draftConfig.countdown_bg_opacity ?? null,
      rsvp_style: {
        bg_color: draftConfig.rsvp_bg_color ?? null,
        bg_opacity: draftConfig.rsvp_bg_opacity ?? null,
        header_font: draftConfig.rsvp_header_font ?? null,
        header_font_en: draftConfig.rsvp_header_font_en ?? null,
        body_font: draftConfig.rsvp_body_font ?? null,
        body_font_en: draftConfig.rsvp_body_font_en ?? null,
        header_effect: draftConfig.rsvp_header_effect ?? "default",
        header_effect_color: draftConfig.rsvp_header_effect_color ?? null,
        header_effect_blur: draftConfig.rsvp_header_effect_blur ?? null,
        header_effect_x: draftConfig.rsvp_header_effect_x ?? null,
        header_effect_y: draftConfig.rsvp_header_effect_y ?? null,
        header_effect_opacity: draftConfig.rsvp_header_effect_opacity ?? null,
        card_shadow_type: draftConfig.rsvp_card_shadow_type ?? "default",
        card_shadow_color: draftConfig.rsvp_card_shadow_color ?? null,
        card_shadow_blur: draftConfig.rsvp_card_shadow_blur ?? null,
        card_shadow_spread: draftConfig.rsvp_card_shadow_spread ?? null,
        card_shadow_x: draftConfig.rsvp_card_shadow_x ?? null,
        card_shadow_y: draftConfig.rsvp_card_shadow_y ?? null,
        card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity ?? null,
      },
      rsvp_bg_color: draftConfig.rsvp_bg_color ?? null,
      rsvp_bg_opacity: draftConfig.rsvp_bg_opacity ?? null,
      rsvp_header_font: draftConfig.rsvp_header_font ?? null,
      rsvp_header_font_en: draftConfig.rsvp_header_font_en ?? null,
      rsvp_body_font: draftConfig.rsvp_body_font ?? null,
      rsvp_body_font_en: draftConfig.rsvp_body_font_en ?? null,
      rsvp_header_effect: draftConfig.rsvp_header_effect ?? null,
      rsvp_header_effect_color: draftConfig.rsvp_header_effect_color ?? null,
      rsvp_header_effect_blur: draftConfig.rsvp_header_effect_blur ?? null,
      rsvp_header_effect_x: draftConfig.rsvp_header_effect_x ?? null,
      rsvp_header_effect_y: draftConfig.rsvp_header_effect_y ?? null,
      rsvp_header_effect_opacity: draftConfig.rsvp_header_effect_opacity ?? null,
      rsvp_card_shadow_type: draftConfig.rsvp_card_shadow_type ?? null,
      rsvp_card_shadow_color: draftConfig.rsvp_card_shadow_color ?? null,
      rsvp_card_shadow_blur: draftConfig.rsvp_card_shadow_blur ?? null,
      rsvp_card_shadow_spread: draftConfig.rsvp_card_shadow_spread ?? null,
      rsvp_card_shadow_x: draftConfig.rsvp_card_shadow_x ?? null,
      rsvp_card_shadow_y: draftConfig.rsvp_card_shadow_y ?? null,
      rsvp_card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity ?? null,
    },
    section_visibility: {},
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up pb-24">
        <div>
          <Link to="/admin/templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold transition-smooth mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> All templates
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-widest uppercase mb-3">
                <Sparkles className="h-3 w-3" /> Template editor
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl text-gradient-gold leading-[1.4] py-1 break-words">{draft.label || "Untitled template"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Renderer: <span className="text-gold">{draft.base_renderer}</span>
                <span className="mx-1.5">·</span>
                slug: <span className="text-gold">{draft.slug}</span>
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="config" className="w-full">
          {/* Sticky Freeze Pane Bar */}
          <div className="sticky top-14 lg:top-0 z-30 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 py-2.5 mb-6 border-b border-border/80 shadow-xs transition-all">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Template quick indicator */}
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="font-serif text-sm font-semibold text-foreground truncate max-w-[200px] lg:max-w-xs">
                  {draft.label || "Untitled template"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  ({draft.slug})
                </span>
              </div>

              {/* Tabs List */}
              <TabsList className="grid w-full sm:w-auto grid-cols-2 font-serif h-9">
                <TabsTrigger value="config" className="text-xs sm:text-sm px-4 py-1.5">Configuration</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs sm:text-sm px-4 py-1.5">Preview</TabsTrigger>
              </TabsList>

              {/* Quick save button */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="h-8 text-xs font-medium bg-gold hover:bg-gold-light text-primary-foreground shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="preview" className="mt-0">
            <PreviewPanel
              event={previewEvent as any}
              guestName={draftConfig.sample_guest_name}
              bare
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6 space-y-8">
            {/* Identity */}
            <CollapsibleSection title="Name & description" defaultOpen={true} rightSlot={sectionSave}>
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input
                    value={draft.label}
                    onChange={e => setDraft({ ...draft, label: e.target.value })}
                    placeholder="essentials-package-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={draft.slug}
                    onChange={e => setDraft({ ...draft, slug: e.target.value.replace(/\s+/g, "-").toLowerCase() })}
                    placeholder="essentials-package-01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stable identifier stored on each event. Avoid renaming once events are using this template.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={draft.description ?? ""}
                    onChange={e => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Deep red & gold, ornate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base renderer</Label>
                  <Select value={draft.base_renderer} onValueChange={v => setDraft({ ...draft, base_renderer: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RENDERERS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The visual design used when this template is rendered. Custom templates pick one of the built-in designs.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-7">
                  <Switch checked={draft.is_active} onCheckedChange={v => setDraft({ ...draft, is_active: v })} />
                  <span className="text-sm">Show in template picker</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* ============== Styling (moved to top per request) ==============
                Order: Front-page background → Invitation-page background → Text colours.
                Only TWO colours drive the entire invitation: body + accent. */}

            {/* Front-page background */}
            <CollapsibleSection
              title="Front-page background"
              description="Used as the full-screen backdrop on the cover (gate) screen. Leave empty to use the default ornate template background."
              defaultOpen={false}
              rightSlot={sectionSave}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start pt-2">
                <div className="w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center">
                  {draftConfig.cover_background_url ? (
                    <img src={draftConfig.cover_background_url} alt="Background" className="h-full w-full object-cover" />
                  ) : (
                    <img src="/templates/khmer-traditional/background.webp" alt="Default background" className="h-full w-full object-cover opacity-90" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                    <Upload className="h-4 w-4" />
                    {uploadProgress["cover-bg"] !== undefined ? "Uploading…" : "Upload background"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadProgress["cover-bg"] !== undefined}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCoverBg(f); e.currentTarget.value = ""; }} />
                  </Label>
                  {uploadBar("cover-bg")}
                  {draftConfig.cover_background_url && (
                    <Button variant="ghost" size="sm" onClick={() => patchConfig({ cover_background_url: null })}>
                      <Trash2 className="h-4 w-4 mr-2" /> Reset to default
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Recommended: 1920×1200 landscape, WEBP/JPG, &lt; 600KB. Will be cropped to fill.</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Invitation page background */}
            <CollapsibleSection
              title="Invitation-page background"
              description="Backdrop for the second (invitation) page. Leave empty to reuse the front-page background."
              defaultOpen={false}
              rightSlot={sectionSave}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start pt-2">
                <div className="w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center">
                  {draftConfig.invite_background_url ? (
                    <img src={draftConfig.invite_background_url} alt="Invitation background" className="h-full w-full object-cover" />
                  ) : draftConfig.cover_background_url ? (
                    <img src={draftConfig.cover_background_url} alt="Inherited from cover" className="h-full w-full object-cover opacity-90" />
                  ) : (
                    <img src="/templates/khmer-traditional/background.webp" alt="Default background" className="h-full w-full object-cover opacity-90" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                    <Upload className="h-4 w-4" />
                    {uploadProgress["invite-bg"] !== undefined ? "Uploading…" : "Upload background"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadProgress["invite-bg"] !== undefined}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadInviteBg(f); e.currentTarget.value = ""; }} />
                  </Label>
                  {uploadBar("invite-bg")}
                  {draftConfig.invite_background_url && (
                    <Button variant="ghost" size="sm" onClick={() => patchConfig({ invite_background_url: null })}>
                      <Trash2 className="h-4 w-4 mr-2" /> Reset to cover background
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Currently: {draftConfig.invite_background_url ? "custom" : draftConfig.cover_background_url ? "inherited from cover" : "default template"}.
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Ornamental frame overlay — only meaningful for the
                Signature Package renderer, but exposed for any renderer
                so future templates can also use a custom frame. PNG with
                transparent center recommended. */}
            {draft?.base_renderer === "signature-package-01" && (
              <CollapsibleSection
                title="Ornamental frame"
                description="Decorative overlay layered over the cover and invitation. Pick a frame from the Asset Library — supports PNG/SVG and short MP4/WebM videos. The centre must be transparent."
                defaultOpen={false}
                rightSlot={sectionSave}
              >
                <div className="pt-2">
                  <FrameLibraryPicker
                    value={draftConfig.frame_url}
                    onChange={(next) => {
                      if (!next) {
                        patchConfig({ frame_url: null, frame_type: "image" });
                      } else {
                        patchConfig({ frame_url: next.media_url, frame_type: next.media_type });
                      }
                    }}
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Background music — default track for this template */}
            <CollapsibleSection
              title="Background music"
              description="Default ambient soundtrack for invitations using this template. Events can override this. Supports MP3 upload, preset tracks, or custom audio links."
              defaultOpen={false}
              rightSlot={sectionSave}
            >
              <MusicEditor
                musicUrl={draftConfig.cover_music_url}
                onChange={(url) => patchConfig({ cover_music_url: url })}
                onUpload={async (file) => {
                  const url = await handleUploadMusic(file);
                  if (url) {
                    patchConfig({ cover_music_url: url });
                    toast.success("Background music updated");
                  }
                }}
                uploading={uploadProgress["audio"] !== undefined}
                autoPlayCover={draftConfig.music_autoplay_cover ?? true}
                autoPlayInvitation={draftConfig.music_autoplay_invitation ?? true}
                onAutoPlayChange={(settings) => {
                  const currentVis = (draftConfig.section_visibility as any) ?? {};
                  const updatedVis = {
                    ...currentVis,
                    music_autoplay_cover: settings.autoPlayCover,
                    music_autoplay_invitation: settings.autoPlayInvitation,
                    music_autoplay_mode:
                      settings.autoPlayCover && settings.autoPlayInvitation
                        ? "both"
                        : settings.autoPlayCover
                        ? "cover"
                        : settings.autoPlayInvitation
                        ? "invitation"
                        : "none",
                  };
                  patchConfig({
                    music_autoplay_cover: settings.autoPlayCover,
                    music_autoplay_invitation: settings.autoPlayInvitation,
                    music_autoplay_mode: updatedVis.music_autoplay_mode,
                    section_visibility: updatedVis,
                  });
                  toast.success("Template default autoplay settings updated");
                }}
              />
            </CollapsibleSection>

            {/* Colors, Typography & Text effects */}
            <CollapsibleSection
              title="Colors, Typography &amp; Text Effects"
              description="Customise heading and body typography, text colours, open invitation button styling, and text drop shadows / glow effects."
              defaultOpen={true}
              rightSlot={sectionSave}
            >
              <div className="space-y-6 pt-2">
                {/* 1. Typography & Font Customization */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <TypeIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground">Typography &amp; Font Selection (ពុម្ពអក្សរ)</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Configure template fonts independently for Khmer and English pages.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="km" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-sm">
                      <TabsTrigger value="km" className="text-xs gap-1.5 font-medium">
                        🇰🇭 Khmer Fonts (ភាសាខ្មែរ)
                      </TabsTrigger>
                      <TabsTrigger value="en" className="text-xs gap-1.5 font-medium">
                        🇬🇧 English Fonts (English)
                      </TabsTrigger>
                    </TabsList>

                    {/* Khmer Fonts Tab */}
                    <TabsContent value="km" className="pt-3 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FontSelector
                          type="header"
                          language="km"
                          label="Khmer Heading &amp; Title Font (ពុម្ពអក្សរចំណងជើងខ្មែរ)"
                          value={draftConfig.header_font_km ?? draftConfig.header_font ?? null}
                          onChange={(val) => patchConfig({ header_font_km: val, header_font: val || draftConfig.header_font })}
                          accentColor={draftConfig.text_color_accent}
                          description="Applied to Khmer main titles, couple names, and section headers."
                        />
                        <FontSelector
                          type="body"
                          language="km"
                          label="Khmer Body &amp; Paragraph Font (ពុម្ពអក្សរខ្លឹមសារខ្មែរ)"
                          value={draftConfig.body_font_km ?? draftConfig.body_font ?? null}
                          onChange={(val) => patchConfig({ body_font_km: val, body_font: val || draftConfig.body_font })}
                          accentColor={draftConfig.text_color_accent}
                          description="Applied to Khmer letters of apology, gratitude, date, and agenda descriptions."
                        />
                      </div>
                    </TabsContent>

                    {/* English Fonts Tab */}
                    <TabsContent value="en" className="pt-3 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FontSelector
                          type="header"
                          language="en"
                          label="English Heading &amp; Title Font (ពុម្ពអក្សរចំណងជើងអង់គ្លេស)"
                          value={draftConfig.header_font_en ?? null}
                          onChange={(val) => patchConfig({ header_font_en: val })}
                          accentColor={draftConfig.text_color_accent}
                          description="Applied to English main titles, couple names, and section headers."
                        />
                        <FontSelector
                          type="body"
                          language="en"
                          label="English Body &amp; Paragraph Font (ពុម្ពអក្សរខ្លឹមសារអង់គ្លេស)"
                          value={draftConfig.body_font_en ?? null}
                          onChange={(val) => patchConfig({ body_font_en: val })}
                          accentColor={draftConfig.text_color_accent}
                          description="Applied to English invitation wording, countdown, and agenda items."
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 2. Color Scheme */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Body text colour</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={draftConfig.text_color_primary ?? "#3b1d12"}
                        onChange={e => patchConfig({ text_color_primary: e.target.value })}
                      />
                      <Input
                        value={draftConfig.text_color_primary ?? ""}
                        onChange={e => patchConfig({ text_color_primary: e.target.value || null })}
                        placeholder="#3b1d12"
                      />
                      {draftConfig.text_color_primary && (
                        <Button variant="ghost" size="sm" onClick={() => patchConfig({ text_color_primary: null })}>Reset</Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Used for parents' names, honorifics, date, venue, agenda items &amp; body text.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent colour</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={draftConfig.text_color_accent ?? "#c89b3c"}
                        onChange={e => patchConfig({ text_color_accent: e.target.value })}
                      />
                      <Input
                        value={draftConfig.text_color_accent ?? ""}
                        onChange={e => patchConfig({ text_color_accent: e.target.value || null })}
                        placeholder="#c89b3c"
                      />
                      {draftConfig.text_color_accent && (
                        <Button variant="ghost" size="sm" onClick={() => patchConfig({ text_color_accent: null })}>Reset</Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Used for titles, couple's names, dividers, icons &amp; borders.</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Open invitation button colour</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={draftConfig.open_button_color || draftConfig.text_color_accent || "#c89b3c"}
                        onChange={e => patchConfig({ open_button_color: e.target.value })}
                      />
                      <Input
                        value={draftConfig.open_button_color ?? ""}
                        onChange={e => patchConfig({ open_button_color: e.target.value || null })}
                        placeholder={draftConfig.text_color_accent || "#c89b3c"}
                      />
                      {draftConfig.open_button_color && (
                        <Button variant="ghost" size="sm" onClick={() => patchConfig({ open_button_color: null })}>Reset</Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Dedicated colour for the "Open Invitation" (បើកលិខិត) button on cover screens. Defaults to accent colour if unset.</p>
                  </div>

                  <div className="space-y-4 md:col-span-2 pt-2 border-t border-border/40">
                    <ElementStyleEditor
                      title="Open map button background & opacity"
                      description="Customise the background colour and opacity for the 'Open Google Maps' button on the invitation."
                      color={draftConfig.map_button_bg_color}
                      opacity={draftConfig.map_button_bg_opacity}
                      defaultColor="#ffffff"
                      defaultOpacity={85}
                      onChange={(c, op) => patchConfig({ map_button_bg_color: c, map_button_bg_opacity: op })}
                    />
                    <ElementStyleEditor
                      title="Countdown card background & opacity"
                      description="Customise the background tint and opacity for the countdown timer card."
                      color={draftConfig.countdown_bg_color}
                      opacity={draftConfig.countdown_bg_opacity}
                      defaultColor="#ffffff"
                      defaultOpacity={25}
                      onChange={(c, op) => patchConfig({ countdown_bg_color: c, countdown_bg_opacity: op })}
                    />
                    <ElementStyleEditor
                      title="RSVP card background & opacity"
                      description="Customise the background tint and opacity for the RSVP response card."
                      color={draftConfig.rsvp_bg_color}
                      opacity={draftConfig.rsvp_bg_opacity}
                      defaultColor="#ffffff"
                      defaultOpacity={25}
                      onChange={(c, op) => patchConfig({ rsvp_bg_color: c, rsvp_bg_opacity: op })}
                    />
                  </div>
                </div>

                {/* 3. Text Effects & Drop Shadows */}
                <div className="pt-4 border-t border-border/50">
                  <TextEffectsEditor
                    config={normalizeTextEffectConfig(draftConfig.text_effect_config)}
                    onChange={(text_effect_config) => patchConfig({ text_effect_config })}
                    accentColor={draftConfig.text_color_accent}
                    primaryColor={draftConfig.text_color_primary}
                    headerFont={draftConfig.header_font}
                    bodyFont={draftConfig.body_font}
                    monogramUrl={draftConfig.cover_image_url}
                  />
                </div>

                {/* 4. Cover Page Invitation Title (សូមគោរពអញ្ជើញ / INVITATION) */}
                <div className="pt-4 border-t border-border/50">
                  <CoverInvitationStyleEditor
                    config={normalizeCoverInvitationStyle(draftConfig.cover_invitation_style)}
                    onChange={(patch) => {
                      const updated = {
                        ...normalizeCoverInvitationStyle(draftConfig.cover_invitation_style),
                        ...patch,
                      };
                      patchConfig({ cover_invitation_style: updated });
                    }}
                    defaultAccentColor={draftConfig.text_color_accent}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Ornamental side frame */}
            <CollapsibleSection
              title="Ornamental side frame"
              description="Decorative ornate frame borders (Khmer vines, royal pillars, lotus garlands) flanking the sides of the screen."
              defaultOpen={draftConfig.side_frame_config?.enabled ?? false}
              rightSlot={
                <div className="flex items-center gap-2">
                  {draftConfig.side_frame_config?.enabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gold/15 text-gold border border-gold/40">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                      Disabled
                    </span>
                  )}
                  {sectionSave}
                </div>
              }
            >
              <div className="pt-2">
                <SideFrameEditor
                  config={draftConfig.side_frame_config}
                  accentColor={draftConfig.text_color_accent}
                  onChange={(side_frame_config) => patchConfig({ side_frame_config })}
                />
              </div>
            </CollapsibleSection>

            {/* Interactive 3D Envelope Unboxing Defaults */}
            <CollapsibleSection
              title="Default 3D Envelope Unboxing Animation"
              description="Configure whether events using this template default to having a luxury 3D animated physical envelope unboxing, royal gatefold doors, or silk ribbon unbox."
              defaultOpen={draftConfig.envelope_unboxing?.enabled ?? false}
              rightSlot={
                <div className="flex items-center gap-2">
                  {draftConfig.envelope_unboxing?.enabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gold/15 text-gold border border-gold/40">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                      Disabled
                    </span>
                  )}
                  {sectionSave}
                </div>
              }
            >
              <div className="pt-2">
                <EnvelopeUnboxingEditor
                  value={draftConfig.envelope_unboxing}
                  accentColor={draftConfig.text_color_accent}
                  onChange={(envelope_unboxing) => patchConfig({ envelope_unboxing })}
                />
              </div>
            </CollapsibleSection>

            {/* ============== End styling ============== */}

            {/* Sample data — same fields as the event editor. */}
            {/* Default per-section visibility for events using this template. */}
            <CollapsibleSection
              title="Default section visibility"
              description="Decide which sections are shown by default on events that pick this template. Each event can override per-event."
              defaultOpen={false}
              rightSlot={sectionSave}
            >
              <div className="pt-2">
                <SectionVisibilityEditor
                  value={draftConfig.section_visibility}
                  onChange={(next) => patchConfig({ section_visibility: next })}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Sample event details" description="These values drive the live preview." defaultOpen={true} rightSlot={sectionSave}>
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Event title</Label>
                  <Input value={draftConfig.title} onChange={e => patchConfig({ title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sample guest name</Label>
                  <Input
                    value={draftConfig.sample_guest_name}
                    onChange={e => patchConfig({ sample_guest_name: e.target.value })}
                    placeholder="Honoured Guest"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <ParentsEditor
                    groomName={draftConfig.groom_name}
                    brideName={draftConfig.bride_name}
                    onChange={({ groom_name, bride_name }) => patchConfig({ groom_name, bride_name })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Event date</Label>
                  <Input
                    type="date"
                    value={draftConfig.event_date ?? ""}
                    onChange={e => patchConfig({ event_date: e.target.value || null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Drives the countdown in the preview. Stored as a date only — no time of day.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Reception / Banquet headline</Label>
                  <Input
                    value={draftConfig.reception_title ?? ""}
                    onChange={e => patchConfig({ reception_title: e.target.value || null })}
                    placeholder="និងពិសារភោជនាអាហារ"
                  />
                  <p className="text-xs text-muted-foreground">
                    Header above the celebration time &amp; venue sentence. Defaults to 'និងពិសារភោជនាអាហារ' (KM) / 'Banquet &amp; Reception' (EN).
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Celebration details sentence (Customizable)</Label>
                  <Textarea
                    rows={2}
                    value={draftConfig.details_message ?? ""}
                    onChange={e => patchConfig({ details_message: e.target.value || null })}
                    placeholder="ដែលនឹងប្រព្រឹត្តទៅនៅ ថ្ងៃចន្ទ ទី១៦ ខែវិច្ឆិកា ឆ្នាំ២០២៦ វេលាម៉ោង ៥:០០ ល្ងាច នៅ ដីព្រេមៀសេនធ័រ សែនសុខ (អគារ H)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom text for the event celebration time &amp; location. When left empty, automatically generated from event date, reception time, and venue name.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Venue name</Label>
                  <Input
                    value={(draftConfig.venue ?? "").split("|")[0]}
                    onChange={(e) => {
                      const link = (draftConfig.venue ?? "").split("|").slice(1).join("|");
                      const next = link ? `${e.target.value}|${link}` : e.target.value;
                      patchConfig({ venue: next || null });
                    }}
                    placeholder="Sofitel Phokeethra, Phnom Penh"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Venue link (Google Maps URL)</Label>
                  <Input
                    value={(draftConfig.venue ?? "").split("|").slice(1).join("|")}
                    onChange={(e) => {
                      const name = (draftConfig.venue ?? "").split("|")[0] ?? "";
                      const next = e.target.value ? `${name}|${e.target.value}` : name;
                      patchConfig({ venue: next || null });
                    }}
                    placeholder="https://maps.app.goo.gl/…"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Custom Google Maps embed (iframe or URL)</Label>
                  <Textarea
                    rows={3}
                    value={draftConfig.map_embed ?? ""}
                    onChange={e => patchConfig({ map_embed: e.target.value || null })}
                    placeholder={'<iframe src="https://www.google.com/maps/embed?…" …></iframe>'}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2 md:col-span-2 pt-2">
                  <ElementStyleEditor
                    title="Open map button appearance & background"
                    description="Customise the background colour and opacity for the 'Open Google Maps' button."
                    color={draftConfig.map_button_bg_color}
                    opacity={draftConfig.map_button_bg_opacity}
                    defaultColor="#ffffff"
                    defaultOpacity={85}
                    onChange={(c, op) => patchConfig({ map_button_bg_color: c, map_button_bg_opacity: op })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Contact phone</Label>
                  <Input
                    value={draftConfig.contact_phone ?? "+855 "}
                    onChange={e => {
                      // Always keep the +855 country prefix — re-inject it if the
                      // admin clears the field or deletes part of the prefix.
                      const next = e.target.value;
                      patchConfig({ contact_phone: next.startsWith("+855") ? next : `+855 ${next.replace(/^\+?855\s*/, "")}` });
                    }}
                    placeholder="+855 12 345 678"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Honorific invitation lines (max 4)</Label>
                  <Textarea
                    rows={4}
                    value={draftConfig.cover_message ?? ""}
                    onChange={e => {
                      const lines = e.target.value.split(/\r?\n/);
                      patchConfig({ cover_message: lines.slice(0, 4).join("\n") });
                    }}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Countdown headline</Label>
                  <Input
                    value={draftConfig.countdown_message ?? "អ្នកត្រូវបានអញ្ជើញមកចូលរួមក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើង​ខ្ញុំ!"}
                    onChange={e => patchConfig({ countdown_message: e.target.value.replace(/[\r\n]+/g, " ") })}
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-populated with the default Khmer headline — clear or edit to customise.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2 pt-1">
                  <ElementStyleEditor
                    title="Countdown card appearance & background"
                    description="Customise the background tint and opacity for the countdown timer section."
                    color={draftConfig.countdown_bg_color}
                    opacity={draftConfig.countdown_bg_opacity}
                    defaultColor="#ffffff"
                    defaultOpacity={25}
                    onChange={(c, op) => patchConfig({ countdown_bg_color: c, countdown_bg_opacity: op })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={draftConfig.description ?? ""}
                    onChange={e => patchConfig({ description: e.target.value })}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Background images / colors. Editing image URLs directly keeps the
                template editor lightweight; admins typically reuse the same
                background across many events so a URL field is enough. */}
            {/* Groom & Bride Logo / Monogram (Cover & Invitation) */}
            <CollapsibleSection title="Groom & Bride Logo / Monogram (Cover & Invitation)" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-1 pb-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Default wedding logo or couple's monogram emblem for this template (transparent PNG or gold crest recommended).
                  Appears on the <strong>Cover Screen</strong> and above the couple's names on the <strong>Invitation Page</strong>.
                </p>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-secondary/60 border border-dashed border-border flex items-center justify-center p-4">
                    {draftConfig.cover_image_url ? (
                      <img src={draftConfig.cover_image_url} alt="Logo / Monogram" className="max-h-full max-w-full object-contain drop-shadow" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground opacity-50">
                        <ImageIcon className="h-9 w-9" />
                        <span className="text-[11px]">No logo / monogram set</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                      <Upload className="h-4 w-4" />
                      {uploadProgress["cover"] !== undefined ? "Uploading…" : "Upload logo / monogram"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadProgress["cover"] !== undefined}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCover(f); e.currentTarget.value = ""; }} />
                    </Label>
                    {uploadBar("cover")}
                    {draftConfig.cover_image_url && (
                      <Button variant="ghost" size="sm" onClick={() => patchConfig({ cover_image_url: null })}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove logo
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">Recommended: Transparent PNG, SVG, or high-res JPG (&lt; 2MB).</p>
                  </div>
                </div>

                {/* Monogram Drop Shadow & Glow Controls */}
                <div className="mt-5 pt-4 border-t border-border">
                  <MonogramEffectEditor
                    settings={
                      normalizeTextEffectConfig(draftConfig.text_effect_config).monogram
                    }
                    onChange={(monogramSettings) => {
                      const currentNorm = normalizeTextEffectConfig(draftConfig.text_effect_config);
                      const updatedTextEffect = { ...currentNorm, monogram: monogramSettings };
                      patchConfig({ text_effect_config: updatedTextEffect });
                    }}
                    monogramUrl={draftConfig.cover_image_url}
                    accentColor={draftConfig.text_color_accent}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Gallery layout — kept here near the gallery itself.
                Other styling (backgrounds + text colours) has moved to the
                top of the config tab so it's the first thing admins see. */}
            <CollapsibleSection title="Gallery layout" defaultOpen={false} rightSlot={sectionSave}>
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Gallery layout</Label>
                  <Select value={draftConfig.gallery_layout} onValueChange={(v: "grid" | "mosaic") => patchConfig({ gallery_layout: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="mosaic">Mosaic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Photo gallery — upload + drag to reorder, mosaic preview. Same UX as the event editor. */}
            <CollapsibleSection
              title="Photo gallery"
              description={<>Up to 24 photos. Each file may be up to <span className="text-gold">5 MB</span>. Drag the <GripVertical className="inline h-3 w-3 align-[-2px]" /> handle to reorder.</>}
              rightSlot={<div className="flex items-center gap-2"><span className="text-xs text-muted-foreground whitespace-nowrap">{(draftConfig.gallery_urls?.length ?? 0)} / 24</span>{sectionSave}</div>}
              defaultOpen={false}
            >
              <div className="pt-2 space-y-4">
                <p className="text-[11px] text-muted-foreground">
                  Mosaic layout: 1 portrait + 2 landscape per group of 3. Extra photos that don't complete a group are hidden on the invitation.
                </p>

                {draftConfig.gallery_urls && draftConfig.gallery_urls.length > 0 && (
                  <DndContext sensors={gallerySensors} collisionDetection={closestCenter} onDragEnd={onGalleryDragEnd}>
                    <SortableContext
                      items={draftConfig.gallery_urls.map((_, i) => `g-${i}`)}
                      strategy={rectSortingStrategy}
                    >
                      {(() => {
                        const urls = draftConfig.gallery_urls;
                        const fullCount = Math.floor(urls.length / 3) * 3;
                        const groups = Array.from({ length: fullCount / 3 }, (_, gi) => urls.slice(gi * 3, gi * 3 + 3));
                        const leftover = urls.slice(fullCount);
                        return (
                          <div className="space-y-3 mb-4">
                            {groups.map((group, gi) => {
                              const base = gi * 3;
                              const portraitLeft = gi % 2 === 0;
                              const slots = portraitLeft
                                ? [
                                    { url: group[0], i: base, cls: "row-span-2 col-start-1" },
                                    { url: group[1], i: base + 1, cls: "col-start-2 row-start-1" },
                                    { url: group[2], i: base + 2, cls: "col-start-2 row-start-2" },
                                  ]
                                : [
                                    { url: group[0], i: base, cls: "col-start-1 row-start-1" },
                                    { url: group[1], i: base + 1, cls: "col-start-1 row-start-2" },
                                    { url: group[2], i: base + 2, cls: "row-span-2 col-start-2" },
                                  ];
                              return (
                                <div
                                  key={`mg-${gi}`}
                                  className="grid grid-cols-2 grid-rows-2 gap-2"
                                  style={{ aspectRatio: "3 / 2" }}
                                >
                                  {slots.map((s) => (
                                    <SortableGalleryItem
                                      key={`g-${s.i}-${s.url}`}
                                      id={`g-${s.i}`}
                                      url={s.url}
                                      index={s.i}
                                      onRemove={() => removeGalleryImage(s.i)}
                                      className={`${s.cls} h-full w-full`}
                                    />
                                  ))}
                                </div>
                              );
                            })}
                            {leftover.length > 0 && (
                              <div>
                                <div className="text-[11px] text-muted-foreground mb-2">
                                  Hidden on the invitation (incomplete group of 3):
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 opacity-60">
                                  {leftover.map((url, idx) => (
                                    <SortableGalleryItem
                                      key={`g-${fullCount + idx}-${url}`}
                                      id={`g-${fullCount + idx}`}
                                      url={url}
                                      index={fullCount + idx}
                                      onRemove={() => removeGalleryImage(fullCount + idx)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </SortableContext>
                  </DndContext>
                )}

                <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading || (draftConfig.gallery_urls?.length ?? 0) >= 24}
                    onChange={(e) => { const f = e.target.files; if (f && f.length) handleUploadGallery(f); e.currentTarget.value = ""; }}
                  />
                </Label>
                {/* Per-file gallery upload progress — multiple bars stack while a batch is in flight. */}
                {Object.entries(uploadProgress)
                  .filter(([k]) => k.startsWith("gallery-"))
                  .map(([k, pct]) => (
                    <div key={k} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">{k.replace(/^gallery-\d+-/, "")}</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  ))}
              </div>
            </CollapsibleSection>

            {/* QR code (gift transfer) — uploaded image + editable message + account name. */}
            <CollapsibleSection title="QR code for gift transfer" defaultOpen={false} rightSlot={sectionSave}>
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>QR code image</Label>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {draftConfig.qr_code_url ? (
                      <img src={draftConfig.qr_code_url} alt="QR" className="h-24 w-24 object-contain rounded-md border bg-white p-1 shrink-0" />
                    ) : (
                      <div className="h-24 w-24 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        No QR
                      </div>
                    )}
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth self-start">
                        <Upload className="h-4 w-4" />
                        {uploadProgress["qr"] !== undefined ? "Uploading…" : "Upload QR"}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadProgress["qr"] !== undefined}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadQr(f); e.currentTarget.value = ""; }} />
                      </Label>
                      {uploadBar("qr")}
                      {draftConfig.qr_code_url && (
                        <Button variant="ghost" size="sm" className="self-start" onClick={() => patchConfig({ qr_code_url: null })}>
                          <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Square PNG/JPG, recommended ≥ 600 × 600 px.</p>
                </div>
                <div className="space-y-2">
                  <Label>Account holder name</Label>
                  <Input
                    value={draftConfig.qr_account_name ?? ""}
                    onChange={(e) => patchConfig({ qr_account_name: e.target.value || null })}
                  />
                  <p className="text-xs text-muted-foreground">Shown under the QR. Leave blank to hide.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>QR description message</Label>
                  <Textarea
                    rows={3}
                    value={draftConfig.qr_code_message ?? ""}
                    onChange={(e) => patchConfig({ qr_code_message: e.target.value || null })}
                    placeholder={"លោកអ្នកក៏អាចផ្ញើចំណងដៃតាមរយៈគណនី QR code របស់ពួកយើង រឺចុចប៊ូតុងខាងក្រោម។"}
                    className="text-center font-khmer-siemreap"
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to use the default Khmer text.</p>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Apologies letter" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Label>Apologies message</Label>
                  <Textarea
                    rows={8}
                    value={draftConfig.apologies_message ?? ""}
                    onChange={(e) => patchConfig({ apologies_message: e.target.value || null })}
                    placeholder={"យើងខ្ញុំជាមាតាបិតា​ កូនប្រុស កូនស្រី សូមអភ័យទោស..."}
                    className="font-khmer-siemreap"
                  />
                  <p className="text-xs text-muted-foreground">
                    The heading is fixed. Edit only the body. Leave blank to use the traditional default.
                  </p>
                </div>
                <LetterCardStyleEditor
                  color={draftConfig.letter_bg_color}
                  opacity={draftConfig.letter_bg_opacity}
                  onChange={(patch) => patchConfig(patch)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Thank-you letter" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Label>Thank-you message</Label>
                  <Textarea
                    rows={8}
                    value={draftConfig.thank_you_message ?? ""}
                    onChange={(e) => patchConfig({ thank_you_message: e.target.value || null })}
                    placeholder={"យើងខ្ញុំជាមាតាបិតា កូនប្រុស កូនស្រី សូមថ្លែងអំណរគុណ..."}
                    className="font-khmer-siemreap"
                  />
                  <p className="text-xs text-muted-foreground">
                    The heading is fixed. Edit only the body. Leave blank to use the default Khmer letter.
                  </p>
                </div>
                <LetterCardStyleEditor
                  color={draftConfig.letter_bg_color}
                  opacity={draftConfig.letter_bg_opacity}
                  onChange={(patch) => patchConfig(patch)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="RSVP card appearance" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-2">
                <RsvpCardStyleEditor
                  config={{
                    rsvp_title: draftConfig.rsvp_title,
                    rsvp_title_en: draftConfig.rsvp_title_en,
                    bg_color: draftConfig.rsvp_bg_color,
                    bg_opacity: draftConfig.rsvp_bg_opacity,
                    header_font: draftConfig.rsvp_header_font,
                    header_font_en: draftConfig.rsvp_header_font_en,
                    body_font: draftConfig.rsvp_body_font,
                    body_font_en: draftConfig.rsvp_body_font_en,
                    header_effect: draftConfig.rsvp_header_effect,
                    header_effect_color: draftConfig.rsvp_header_effect_color,
                    header_effect_blur: draftConfig.rsvp_header_effect_blur,
                    header_effect_x: draftConfig.rsvp_header_effect_x,
                    header_effect_y: draftConfig.rsvp_header_effect_y,
                    header_effect_opacity: draftConfig.rsvp_header_effect_opacity,
                    card_shadow_type: draftConfig.rsvp_card_shadow_type,
                    card_shadow_color: draftConfig.rsvp_card_shadow_color,
                    card_shadow_blur: draftConfig.rsvp_card_shadow_blur,
                    card_shadow_spread: draftConfig.rsvp_card_shadow_spread,
                    card_shadow_x: draftConfig.rsvp_card_shadow_x,
                    card_shadow_y: draftConfig.rsvp_card_shadow_y,
                    card_shadow_opacity: draftConfig.rsvp_card_shadow_opacity,
                  }}
                  accentColor={draftConfig.text_color_accent}
                  primaryColor={draftConfig.text_color_primary}
                  globalHeaderFont={draftConfig.header_font}
                  globalBodyFont={draftConfig.body_font}
                  onChange={(patch) => {
                    const p: Partial<TemplateConfig> = {};
                    if (patch.rsvp_title !== undefined) p.rsvp_title = patch.rsvp_title;
                    if (patch.rsvp_title_en !== undefined) p.rsvp_title_en = patch.rsvp_title_en;
                    if (patch.bg_color !== undefined) p.rsvp_bg_color = patch.bg_color;
                    if (patch.bg_opacity !== undefined) p.rsvp_bg_opacity = patch.bg_opacity;
                    if (patch.header_font !== undefined) p.rsvp_header_font = patch.header_font;
                    if (patch.header_font_en !== undefined) p.rsvp_header_font_en = patch.header_font_en;
                    if (patch.body_font !== undefined) p.rsvp_body_font = patch.body_font;
                    if (patch.body_font_en !== undefined) p.rsvp_body_font_en = patch.body_font_en;
                    if (patch.header_effect !== undefined) p.rsvp_header_effect = patch.header_effect;
                    if (patch.header_effect_color !== undefined) p.rsvp_header_effect_color = patch.header_effect_color;
                    if (patch.header_effect_blur !== undefined) p.rsvp_header_effect_blur = patch.header_effect_blur;
                    if (patch.header_effect_x !== undefined) p.rsvp_header_effect_x = patch.header_effect_x;
                    if (patch.header_effect_y !== undefined) p.rsvp_header_effect_y = patch.header_effect_y;
                    if (patch.header_effect_opacity !== undefined) p.rsvp_header_effect_opacity = patch.header_effect_opacity;
                    if (patch.card_shadow_type !== undefined) p.rsvp_card_shadow_type = patch.card_shadow_type;
                    if (patch.card_shadow_color !== undefined) p.rsvp_card_shadow_color = patch.card_shadow_color;
                    if (patch.card_shadow_blur !== undefined) p.rsvp_card_shadow_blur = patch.card_shadow_blur;
                    if (patch.card_shadow_spread !== undefined) p.rsvp_card_shadow_spread = patch.card_shadow_spread;
                    if (patch.card_shadow_x !== undefined) p.rsvp_card_shadow_x = patch.card_shadow_x;
                    if (patch.card_shadow_y !== undefined) p.rsvp_card_shadow_y = patch.card_shadow_y;
                    if (patch.card_shadow_opacity !== undefined) p.rsvp_card_shadow_opacity = patch.card_shadow_opacity;
                    patchConfig(p);
                  }}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Sample agenda" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-2">
                <AgendaEditor
                  days={draftConfig.agenda_days}
                  viewStyle={draftConfig.agenda_view_style}
                  assetColor={draftConfig.agenda_asset_color}
                  bgColor={draftConfig.agenda_bg_color}
                  bgOpacity={draftConfig.agenda_bg_opacity}
                  onChange={(days) => patchConfig({ agenda_days: days })}
                  onChangeViewStyle={(v) => patchConfig({ agenda_view_style: v })}
                  onChangeStyle={(patch) => {
                    const currentVis = (draftConfig.section_visibility as any) ?? {};
                    const nextVis = {
                      ...currentVis,
                      agenda_style: {
                        ...(currentVis.agenda_style ?? {}),
                        bg_color: patch.agenda_bg_color !== undefined ? patch.agenda_bg_color : (draftConfig.agenda_bg_color ?? null),
                        bg_opacity: patch.agenda_bg_opacity !== undefined ? patch.agenda_bg_opacity : (draftConfig.agenda_bg_opacity ?? null),
                        asset_color: patch.agenda_asset_color !== undefined ? patch.agenda_asset_color : (draftConfig.agenda_asset_color ?? null),
                      },
                      agenda_bg_color: patch.agenda_bg_color !== undefined ? patch.agenda_bg_color : (draftConfig.agenda_bg_color ?? null),
                      agenda_bg_opacity: patch.agenda_bg_opacity !== undefined ? patch.agenda_bg_opacity : (draftConfig.agenda_bg_opacity ?? null),
                      agenda_asset_color: patch.agenda_asset_color !== undefined ? patch.agenda_asset_color : (draftConfig.agenda_asset_color ?? null),
                    };
                    patchConfig({ ...patch, section_visibility: nextVis });
                  }}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Sample contacts" defaultOpen={false} rightSlot={sectionSave}>
              <div className="pt-2">
                <ContactsEditor
                  contacts={draftConfig.contacts}
                  onChange={(contacts) => patchConfig({ contacts })}
                />
              </div>
            </CollapsibleSection>
          </TabsContent>
        </Tabs>

        {/* Sticky save bar — same pattern as the billing editor. */}
        <div className="sticky bottom-4 z-30 flex justify-end">
          <div
            className={`flex items-center gap-3 rounded-full border bg-card/95 backdrop-blur px-4 py-2 shadow-lg transition-all ${
              dirty ? "border-gold/50" : "border-border opacity-80"
            }`}
          >
            {dirty && (
              <span className="flex items-center gap-1.5 text-xs text-gold">
                <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving…" : "Save template"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
