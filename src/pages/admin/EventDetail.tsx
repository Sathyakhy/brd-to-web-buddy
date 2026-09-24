import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Copy, RefreshCw, Trash2, Save, ExternalLink, Upload, Image as ImageIcon, GripVertical, Search, Pencil, Check, X, FileSpreadsheet, FileDown, FileUp, Music, Send, Undo2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { generateToken, formatDateTime } from "@/lib/invitation";
import { RsvpBadge } from "@/components/admin/RsvpBadge";
import { useTemplates } from "@/hooks/useTemplates";
import AgendaEditor from "@/components/admin/AgendaEditor";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

/* Local Khmer date formatter (mirrors the one in InvitationTemplate.tsx)
   so the host's exported invitation message reads naturally in Khmer. */
const KHMER_DIGITS = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];
const KHMER_WEEKDAYS_LOCAL = ["អាទិត្យ","ច័ន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const KHMER_MONTHS_LOCAL = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];
const toKhmerNum = (n: number) => String(n).split("").map(d => KHMER_DIGITS[+d] ?? d).join("");
function formatKhmerDateLocal(d: string | null | undefined) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `ថ្ងៃ${KHMER_WEEKDAYS_LOCAL[dt.getDay()]} ទី${toKhmerNum(dt.getDate())} ខែ${KHMER_MONTHS_LOCAL[dt.getMonth()]} ឆ្នាំ${toKhmerNum(dt.getFullYear())}`;
}
import { AgendaDay, AgendaViewStyle, normalizeAgenda, buildLegacyAgenda } from "@/lib/agenda";
import ContactsEditor from "@/components/admin/ContactsEditor";
import { ContactItem, normalizeContacts, buildLegacyContacts } from "@/lib/contacts";
import ParentsEditor from "@/components/admin/ParentsEditor";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import LetterCardStyleEditor from "@/components/admin/LetterCardStyleEditor";
import MusicEditor from "@/components/admin/MusicEditor";
import PreviewPanel from "@/components/admin/PreviewPanel";
import EventBillingTab from "@/components/admin/EventBillingTab";
import SortableGalleryItem from "@/components/admin/SortableGalleryItem";
import SectionVisibilityEditor from "@/components/admin/SectionVisibilityEditor";
import DualLanguageEditor from "@/components/admin/DualLanguageEditor";
import { normalizeVisibility, SectionVisibility } from "@/lib/sectionVisibility";
import { getDualLanguageConfig, type DualLanguageConfig } from "@/lib/dualLanguage";
import { BilingualInput, BilingualTextarea } from "@/components/admin/BilingualField";
import { thumbUrl } from "@/lib/imageUrl";
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

type Event = {
  id: string; slug: string; title: string; internal_title: string | null; template: string;
  event_date: string | null; venue: string | null; description: string | null;
  cover_message: string | null; cover_image_url: string | null;
  countdown_message: string | null;
  cover_background_url: string | null;
  invite_background_url: string | null;
  gallery_urls: string[] | null;
  gallery_layout: "grid" | "mosaic";
  ceremony_time: string | null; reception_time: string | null;
  dress_code: string | null; contact_phone: string | null;
  bride_name: string | null; groom_name: string | null;
  agenda_days: AgendaDay[];
  agenda_view_style: AgendaViewStyle;
  contacts: ContactItem[];
  map_embed: string | null;
  map_image_url: string | null;
  max_guests: number | null;
  text_color_primary: string | null;
  text_color_accent: string | null;
  open_button_color: string | null;
  text_effect_config: TextEffectConfig;
  access_starts_at: string | null;
  access_ends_at: string | null;
  price_total: number | null;
  price_currency: string | null;
  paid_amount: number | null;
  payment_status: string | null;
  section_visibility: SectionVisibility;
  dual_language_config?: DualLanguageConfig;
  qr_code_url: string | null;
  qr_code_message: string | null;
  qr_account_name: string | null;
  apologies_message: string | null;
  thank_you_message: string | null;
  letter_bg_color: string | null;
  letter_bg_opacity: number | null;
  agenda_bg_color?: string | null;
  agenda_bg_opacity?: number | null;
  agenda_asset_color?: string | null;
  side_frame_config?: SideFrameConfig;
  cover_music_url: string | null;
  share_preview_index: number | null;
  header_font?: string | null;
  body_font: string | null;
};

type Guest = {
  id: string; name: string; token: string; rsvp_status: string;
  party_size: number; message: string | null; responded_at: string | null;
  invite_sent_at: string | null;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = ["config", "preview", "billing", "guests"].includes(tabParam ?? "")
    ? (tabParam as string)
    : "config";
  const { templates: TEMPLATES } = useTemplates();
  /** Map of template slug → its `config.section_visibility` defaults. */
  const [templateVisibilityBySlug, setTemplateVisibilityBySlug] = useState<Record<string, SectionVisibility>>({});
  const [templateDefaultsBySlug, setTemplateDefaultsBySlug] = useState<Record<string, any>>({});
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState("");
  // Guest list controls
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<"all" | "yes" | "no" | "pending" | "sent" | "unsent">("all");
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Customer access — list of profiles that can manage this event from the
  // customer dashboard (event_customers join). Loaded alongside the event.
  type CustomerProfile = { user_id: string; email: string | null; display_name: string | null };
  const [customers, setCustomers] = useState<CustomerProfile[]>([]); // all profiles with 'customer' role
  const [linkedCustomerIds, setLinkedCustomerIds] = useState<Set<string>>(new Set());
  const [savingCustomers, setSavingCustomers] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [evRes, gRes, linksRes, rolesRes, profilesRes, tplRes] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("guests").select("*").eq("event_id", id).order("created_at", { ascending: false }),
      supabase.from("event_customers").select("user_id").eq("event_id", id),
      supabase.from("user_roles").select("user_id, role").eq("role", "customer" as any),
      supabase.from("profiles").select("user_id, email, display_name").order("display_name", { ascending: true }),
      supabase.from("templates").select("slug, config"),
    ]);
    if (evRes.error) toast.error(evRes.error.message);
    // Build the template-slug → section_visibility and default config map.
    const tplMap: Record<string, SectionVisibility> = {};
    const tplDefMap: Record<string, any> = {};
    for (const t of (tplRes.data ?? []) as any[]) {
      tplMap[t.slug] = normalizeVisibility((t.config ?? {}).section_visibility);
      tplDefMap[t.slug] = t.config ?? {};
    }
    setTemplateVisibilityBySlug(tplMap);
    setTemplateDefaultsBySlug(tplDefMap);
    const raw = evRes.data as any;
    if (raw) {
      const normalized = normalizeAgenda(raw.agenda_days);
      const days = normalized.length
        ? normalized
        : buildLegacyAgenda({ ceremony_time: raw.ceremony_time, reception_time: raw.reception_time });
      const view: AgendaViewStyle = raw.agenda_view_style === "card" ? "card" : "list";
      const galleryLayout: "grid" | "mosaic" = raw.gallery_layout === "mosaic" ? "mosaic" : "grid";
      const contactsList = normalizeContacts(raw.contacts);
      const contacts = contactsList.length ? contactsList : buildLegacyContacts(raw.contact_phone);
      const section_visibility = normalizeVisibility(raw.section_visibility);
      const dual_language_config = getDualLanguageConfig(
        raw.dual_language_config ?? (raw.section_visibility as any)?.dual_language ?? raw.section_visibility,
        raw
      );
      const open_button_color = raw.open_button_color ?? (raw.section_visibility as any)?.open_button_color ?? null;
      const text_effect_config = normalizeTextEffectConfig(
        raw.text_effect_config ?? (raw.section_visibility as any)?.text_effects ?? (raw.section_visibility as any)?.text_effect_config ?? raw
      );
      const agenda_bg_color = (raw as any).agenda_bg_color ?? (raw.section_visibility as any)?.agenda_style?.bg_color ?? (raw.section_visibility as any)?.agenda_bg_color ?? null;
      const agenda_bg_opacity = (raw as any).agenda_bg_opacity ?? (raw.section_visibility as any)?.agenda_style?.bg_opacity ?? (raw.section_visibility as any)?.agenda_bg_opacity ?? null;
      const agenda_asset_color = (raw as any).agenda_asset_color ?? (raw.section_visibility as any)?.agenda_style?.asset_color ?? (raw.section_visibility as any)?.agenda_asset_color ?? null;
      const side_frame_config = normalizeSideFrameConfig(
        raw.side_frame_config ?? (raw.section_visibility as any)?.side_frame_config ?? (raw.section_visibility as any)?.side_frame
      );
      setEvent({
        ...raw,
        agenda_days: days,
        agenda_view_style: view,
        agenda_bg_color,
        agenda_bg_opacity,
        agenda_asset_color,
        side_frame_config,
        gallery_layout: galleryLayout,
        contacts,
        section_visibility,
        dual_language_config,
        open_button_color,
        text_effect_config,
      } as Event);
    } else {
      setEvent(null);
    }
    setGuests((gRes.data ?? []) as Guest[]);

    // Build the list of customer-role profiles + already-linked ids.
    const customerIds = new Set((rolesRes.data ?? []).map((r: any) => r.user_id));
    const allProfiles = (profilesRes.data ?? []) as CustomerProfile[];
    setCustomers(allProfiles.filter(p => customerIds.has(p.user_id)));
    setLinkedCustomerIds(new Set((linksRes.data ?? []).map((l: any) => l.user_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const isDual = Boolean(event?.dual_language_config?.enabled);

  const updateEnField = (field: string, value: string | null) => {
    if (!event) return;
    const currentDual = event.dual_language_config ?? { enabled: false, default_language: "km", km: {}, en: {} };
    setEvent({
      ...event,
      dual_language_config: {
        ...currentDual,
        en: {
          ...currentDual.en,
          [field]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    const updatedVisibility = {
      ...(event.section_visibility as any),
      dual_language: event.dual_language_config,
      open_button_color: event.open_button_color,
      text_effects: event.text_effect_config,
      side_frame_config: event.side_frame_config,
      music_autoplay_cover: (event as any).music_autoplay_cover ?? (event.section_visibility as any)?.music_autoplay_cover ?? true,
      music_autoplay_invitation: (event as any).music_autoplay_invitation ?? (event.section_visibility as any)?.music_autoplay_invitation ?? true,
      music_autoplay_mode: (event as any).music_autoplay_mode ?? (event.section_visibility as any)?.music_autoplay_mode ?? "both",
      agenda_style: {
        bg_color: event.agenda_bg_color ?? null,
        bg_opacity: event.agenda_bg_opacity ?? null,
        asset_color: event.agenda_asset_color ?? null,
      },
    };
    const { error } = await supabase.from("events").update({
      title: event.title,
      internal_title: event.internal_title,
      slug: event.slug,
      template: event.template,
      event_date: event.event_date,
      venue: event.venue,
      cover_message: event.cover_message,
      countdown_message: event.countdown_message,
      description: event.description,
      cover_image_url: event.cover_image_url,
      cover_background_url: event.cover_background_url,
      invite_background_url: event.invite_background_url,
      ceremony_time: event.ceremony_time,
      reception_time: event.reception_time,
      dress_code: event.dress_code,
      contact_phone: event.contact_phone,
      bride_name: event.bride_name,
      groom_name: event.groom_name,
      agenda_days: event.agenda_days as any,
      agenda_view_style: event.agenda_view_style,
      gallery_layout: event.gallery_layout,
      contacts: event.contacts as any,
      map_embed: event.map_embed,
      map_image_url: event.map_image_url,
      max_guests: event.max_guests,
      text_color_primary: event.text_color_primary,
      text_color_accent: event.text_color_accent,
      open_button_color: event.open_button_color,
      text_effect_config: event.text_effect_config as any,
      access_starts_at: event.access_starts_at,
      access_ends_at: event.access_ends_at,
      section_visibility: updatedVisibility as any,
      qr_code_url: event.qr_code_url,
      qr_code_message: event.qr_code_message,
      qr_account_name: event.qr_account_name,
      apologies_message: event.apologies_message,
      thank_you_message: event.thank_you_message,
      letter_bg_color: event.letter_bg_color,
      letter_bg_opacity: event.letter_bg_opacity,
      cover_music_url: event.cover_music_url,
      share_preview_index: event.share_preview_index,
      header_font: event.header_font ?? null,
      body_font: event.body_font,
    }).eq("id", event.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Event updated");
  };

  const handleUploadCover = async (file: File) => {
    if (!event) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/cover-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, cover_image_url: data.publicUrl });
    await supabase.from("events").update({ cover_image_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
    toast.success("Cover image uploaded");
  };

  const handleUploadBackground = async (file: File) => {
    if (!event) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/background-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, cover_background_url: data.publicUrl });
    await supabase.from("events").update({ cover_background_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
    toast.success("Background uploaded");
  };

  const handleUploadInviteBackground = async (file: File) => {
    if (!event) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/invite-bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, invite_background_url: data.publicUrl });
    await supabase.from("events").update({ invite_background_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
  };

  const handleUploadQrCode = async (file: File) => {
    if (!event) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/qr-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, qr_code_url: data.publicUrl });
    await supabase.from("events").update({ qr_code_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
    toast.success("QR code uploaded");
  };

  const handleUploadMapImage = async (file: File) => {
    if (!event) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/map-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, map_image_url: data.publicUrl });
    await supabase.from("events").update({ map_image_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
    toast.success("Map image uploaded");
  };

  const handleUploadCoverMusic = async (file: File) => {
    if (!event) return;
    const MAX = 15 * 1024 * 1024;
    if (file.size > MAX) return toast.error("Max 15 MB audio file");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${event.id}/cover-music-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-media").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    setEvent({ ...event, cover_music_url: data.publicUrl });
    await supabase.from("events").update({ cover_music_url: data.publicUrl }).eq("id", event.id);
    setUploading(false);
    toast.success("Background music uploaded and activated");
  };

  const handleUploadGallery = async (files: FileList) => {
    if (!event) return;
    const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per image — keep originals high-quality
    const current = event.gallery_urls ?? [];
    const remaining = 24 - current.length;
    if (remaining <= 0) {
      toast.error("Gallery is full (24 images max)");
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of toUpload) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: max 5 MB`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${event.id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-media")
        .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
      if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
      const { data } = supabase.storage.from("event-media").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    const next = [...current, ...uploaded];
    setEvent({ ...event, gallery_urls: next });
    await supabase.from("events").update({ gallery_urls: next }).eq("id", event.id);
    setUploading(false);
    if (uploaded.length) toast.success(`Uploaded ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""}`);
  };

  const removeGalleryImage = async (idx: number) => {
    if (!event) return;
    const next = (event.gallery_urls ?? []).filter((_, i) => i !== idx);
    setEvent({ ...event, gallery_urls: next });
    await supabase.from("events").update({ gallery_urls: next }).eq("id", event.id);
    toast.success("Photo removed");
  };

  const reorderGallery = async (from: number, to: number) => {
    if (!event) return;
    const current = event.gallery_urls ?? [];
    if (from < 0 || to < 0 || from >= current.length || to >= current.length) return;
    const next = arrayMove(current, from, to);
    setEvent({ ...event, gallery_urls: next });
    await supabase.from("events").update({ gallery_urls: next }).eq("id", event.id);
  };

  const gallerySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onGalleryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !event?.gallery_urls) return;
    const ids = event.gallery_urls.map((_, i) => `g-${i}`);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    reorderGallery(from, to);
  };

  /**
   * Insert a batch of guests, enforcing the optional `max_guests` cap.
   * Returns true on success so callers (manual / Excel import) can clear UI.
   */
  const insertGuestsBatch = async (names: string[]): Promise<boolean> => {
    if (!event) return false;
    const cleaned = names.map(n => n.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error("No guest names found");
      return false;
    }
    const cap = event.max_guests ?? null;
    if (cap !== null) {
      const remaining = Math.max(0, cap - guests.length);
      if (remaining <= 0) {
        toast.error(`Guest limit reached (${cap}). Increase the maximum to add more.`);
        return false;
      }
      if (cleaned.length > remaining) {
        toast.error(`Only ${remaining} more allowed (max ${cap}). Remove ${cleaned.length - remaining} name(s) and try again.`);
        return false;
      }
    }
    const rows = cleaned.map(name => ({ event_id: event.id, name, token: generateToken(12) }));
    const { data: inserted, error } = await supabase
      .from("guests")
      .insert(rows)
      .select("*");
    if (error) { toast.error(error.message); return false; }
    if (inserted && inserted.length) {
      setGuests(prev => [...(inserted as Guest[]), ...prev]);
    }
    toast.success(`Added ${cleaned.length} guest${cleaned.length > 1 ? "s" : ""}`);
    return true;
  };

  const handleAddGuests = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkNames.split("\n");
    const ok = await insertGuestsBatch(names);
    if (ok) {
      setBulkNames("");
      setAddOpen(false);
    }
  };

  /** Download a blank .xlsx template guests can fill in and re-import.
   *  Header row only — no example/dummy rows so admins can't accidentally
   *  re-import them. */
  const downloadGuestTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Party size", "Message"],
    ]);
    ws["!cols"] = [{ wch: 32 }, { wch: 12 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, `${event?.slug || "event"}-guest-template.xlsx`);
  };

  /** Read an .xlsx file and import the "Name" column as new guests. */
  const importGuestsExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) { toast.error("No sheet found in file"); return; }
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      // Accept any case/spacing for the Name column.
      const names = rows
        .map(r => {
          const k = Object.keys(r).find(k => k.trim().toLowerCase() === "name");
          return k ? String(r[k] ?? "").trim() : "";
        })
        .filter(Boolean);
      if (names.length === 0) {
        toast.error('No "Name" column values found. Use the template format.');
        return;
      }
      await insertGuestsBatch(names);
    } catch (err: any) {
      toast.error(err?.message || "Failed to read Excel file");
    }
  };

  /**
   * Build the public, share-friendly invitation URL. Routes through the
   * `invite-share` edge function so when guests paste the link into
   * Facebook / Telegram / WhatsApp / etc. the crawler receives rich Open
   * Graph tags (event title, guest name, Khmer wording, first gallery
   * photo). Real users are redirected to the SPA invitation page instantly.
   */
  const buildShareUrl = (token: string) => {
    if (!event) return "";
    // Branded share subdomain — Cloudflare Worker on share.21invite.online
    // serves OG preview tags to crawlers and 302-redirects humans to the
    // root domain SPA invitation page.
    return `https://share.21invite.online/${encodeURIComponent(event.slug)}/invite?token=${encodeURIComponent(token)}`;
  };

  /** Short, branded invitation URL guests will actually see when the host
   *  copies/pastes the link into a chat. Hosts strongly prefer this over
   *  the long edge-function URL used purely for social-media OG previews. */
  const buildBrandedUrl = (token: string) => {
    if (!event) return "";
    return `https://21invite.online/${event.slug}/invite?token=${encodeURIComponent(token)}`;
  };

  /** Render the ready-to-send Khmer invitation message a host can paste
   *  directly into Telegram/Messenger for each guest. */
  const buildKhmerMessage = (guestName: string, token: string) => {
    if (!event) return "";
    // Names may be stored pipe-separated like "លោក|សោម|សុឃី" — flatten to spaces.
    const cleanName = (raw: string | null) =>
      (raw ?? "").split(/\n|\s\/\s/)[0]?.replace(/\|/g, " ").replace(/\s+/g, " ").trim() || "";
    const groom = cleanName(event.groom_name) || "<Groom's Name>";
    const bride = cleanName(event.bride_name) || "<Bride's Name>";
    const couple = `${groom} និង ${bride}`;
    const dateStr = formatKhmerDateLocal(event.event_date) || "<event date>";
    const venue = ((event.venue ?? "").split("|")[0] ?? "").trim() || "<venue location>";
    const link = buildShareUrl(token);
    return [
      "សូមគោរពអញ្ជើញ",
      guestName,
      "",
      `ដោយសេចក្តីគោរព ពីយើងខ្ញុំ ${couple} សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ អ្នកឧកញ៉ា លោកឧកញ៉ា លោក លោកស្រី និងភ្ញៀវកិត្តិយសទាំងអស់ មេត្តាអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយសក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ ដែលនឹងប្រព្រឹត្តទៅនៅ${dateStr} នៅ${venue} ដោយមេត្រីភាព និងកិត្តិយសដ៏ខ្ពង់ខ្ពស់ 🙏`,
      "",
      "ការអញ្ជើញចូលរួមរបស់លោក លោកស្រី និងភ្ញៀវកិត្តិយសទាំងអស់ គឺជាកិត្តិយសដ៏ខ្ពង់ខ្ពស់ និងធ្វើឱ្យថ្ងៃមង្គលរបស់យើងខ្ញុំកាន់តែមានន័យ 🙏",
      "",
      "យើងខ្ញុំទាំងពីរសូមអធ្យាស្រ័យយ៉ាងខ្ពង់ខ្ពស់ ចំពោះភ្ញៀវកិត្តិយសទាំងអស់ ដែលយើងខ្ញុំមិនអាចទៅគោរពអញ្ជើញដោយផ្ទាល់ 🙏",
      "",
      "ដោយសេចក្តីគោរព និងសេចក្តីស្រឡាញ់យ៉ាងខ្ពង់ខ្ពស់ 🙏",
      "",
      "សម្រាប់ព័ត៌មានលម្អិតបន្ថែម សូមមេត្តាចូលមើលពាក្យអញ្ជើញអេឡិចត្រូនិករបស់យើងខ្ញុំដែលបានបង្ហាញខាងក្រោម 👇",
      link,
    ].join("\n");
  };

  /** Export the current guest list (with RSVP details) as .xlsx. */
  const exportGuestsExcel = () => {
    if (!event) return;
    const data = guests.map(g => ({
      Name: g.name,
      "RSVP status": g.rsvp_status,
      "Party size": g.party_size,
      Message: g.message ?? "",
      "Responded at": g.responded_at ? new Date(g.responded_at).toLocaleString() : "",
      "Invitation sent at": g.invite_sent_at ? new Date(g.invite_sent_at).toLocaleString() : "",
      "Invitation link": buildShareUrl(g.token),
      "Invitation message (Khmer)": buildKhmerMessage(g.name, g.token),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 32 },
      { wch: 22 }, { wch: 22 }, { wch: 60 }, { wch: 80 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, `${event.slug}-guests-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };


  const copyLink = (token: string) => {
    if (!event) return;
    navigator.clipboard.writeText(buildShareUrl(token));
    toast.success("Invitation link copied");
  };

  const regenerate = async (g: Guest) => {
    const newToken = generateToken(12);
    const { error } = await supabase.from("guests").update({ token: newToken }).eq("id", g.id);
    if (error) return toast.error(error.message);
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, token: newToken } : x));
    toast.success("Token regenerated");
  };

  /** Toggle the "invitation sent" marker for a guest. Lets hosts track who
   *  has already received their link without affecting RSVP state. */
  const toggleSent = async (g: Guest) => {
    const next = g.invite_sent_at ? null : new Date().toISOString();
    const { error } = await supabase.from("guests").update({ invite_sent_at: next }).eq("id", g.id);
    if (error) return toast.error(error.message);
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, invite_sent_at: next } : x));
    toast.success(next ? "Marked as sent" : "Marked as not sent");
  };

  const removeGuest = async (g: Guest) => {
    if (!confirm(`Remove ${g.name}?`)) return;
    const { error } = await supabase.from("guests").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    setGuests(prev => prev.filter(x => x.id !== g.id));
    setSelectedGuestIds(prev => {
      if (!prev.has(g.id)) return prev;
      const next = new Set(prev);
      next.delete(g.id);
      return next;
    });
    toast.success("Guest removed");
  };

  const toggleGuestSelected = (id: string) => {
    setSelectedGuestIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setAllSelected = (ids: string[], checked: boolean) => {
    setSelectedGuestIds(prev => {
      const next = new Set(prev);
      if (checked) ids.forEach(id => next.add(id));
      else ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedGuestIds(new Set());

  const bulkRemoveSelected = async () => {
    const ids = Array.from(selectedGuestIds);
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} selected guest${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const { error } = await supabase.from("guests").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) return toast.error(error.message);
    const removed = new Set(ids);
    setGuests(prev => prev.filter(x => !removed.has(x.id)));
    clearSelection();
    toast.success(`Removed ${ids.length} guest${ids.length === 1 ? "" : "s"}`);
  };

  const startEditGuest = (g: Guest) => {
    setEditingGuestId(g.id);
    setEditingGuestName(g.name);
  };
  const cancelEditGuest = () => {
    setEditingGuestId(null);
    setEditingGuestName("");
  };
  const saveEditGuest = async (g: Guest) => {
    const newName = editingGuestName.trim();
    if (!newName) return toast.error("Name cannot be empty");
    if (newName === g.name) { cancelEditGuest(); return; }
    const { error } = await supabase.from("guests").update({ name: newName }).eq("id", g.id);
    if (error) return toast.error(error.message);
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, name: newName } : x));
    cancelEditGuest();
    toast.success("Guest renamed");
  };

  // Toggle a customer's link to this event in local state. Saved on click of
  // "Save customer access" so admins can stage multiple changes at once.
  const toggleCustomerLink = (userId: string) => {
    setLinkedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const saveCustomerAccess = async () => {
    if (!event) return;
    setSavingCustomers(true);
    const { data: existing } = await supabase
      .from("event_customers").select("user_id").eq("event_id", event.id);
    const current = new Set((existing ?? []).map((r: any) => r.user_id));
    const toAdd = [...linkedCustomerIds].filter(uid => !current.has(uid));
    const toRemove = [...current].filter(uid => !linkedCustomerIds.has(uid));

    if (toAdd.length) {
      const { error } = await supabase.from("event_customers")
        .insert(toAdd.map(user_id => ({ event_id: event.id, user_id })));
      if (error) { setSavingCustomers(false); return toast.error(error.message); }
    }
    if (toRemove.length) {
      const { error } = await supabase.from("event_customers")
        .delete().eq("event_id", event.id).in("user_id", toRemove);
      if (error) { setSavingCustomers(false); return toast.error(error.message); }
    }
    setSavingCustomers(false);
    toast.success("Customer access updated");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center text-sm text-muted-foreground py-12">Loading…</div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Link to="/admin/events"><Button variant="outline">Back to events</Button></Link>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: guests.length,
    yes: guests.filter(g => g.rsvp_status === "yes").length,
    no: guests.filter(g => g.rsvp_status === "no").length,
    pending: guests.filter(g => g.rsvp_status === "pending").length,
  };

  const dtLocal = event.event_date ? new Date(event.event_date).toISOString().slice(0, 10) : "";

  // Per-section save button — mirrors the TemplateDetail pattern so each
  // collapsible section has its own inline Save chip at the top-right.
  // It triggers the full event update (cheap for our row size) and stops
  // propagation so clicking it does not toggle the section open/closed.
  const sectionSave = (
    <Button
      size="sm"
      variant="default"
      onClick={(e) => { e.stopPropagation(); handleSave(); }}
      disabled={saving}
      className="bg-gradient-gold text-primary-foreground hover:opacity-90"
    >
      {saving ? (
        <>Saving…</>
      ) : (
        <><Save className="h-3.5 w-3.5 mr-1" /> Save</>
      )}
    </Button>
  );

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up">
        <div>
          <Link to="/admin/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold transition-smooth mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> All events
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              {event.internal_title && (
                <p className="text-xs uppercase tracking-widest text-gold/80 mb-1">{event.internal_title}</p>
              )}
              <h1 className="font-khmer-moul text-xl sm:text-3xl md:text-4xl text-gradient-gold leading-[1.4] py-1 break-words">{event.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">/<span className="text-gold">{event.slug}</span></p>
            </div>
            <a
              href={`https://21invite.online/${event.slug}/invite?token=preview`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" size="sm" className="sm:size-default">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View public page</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Preview ⇄ Configuration tabs — keeps the live preview visually
            separated from the form sections, so admins can focus on one task
            at a time without scrolling past the other. */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const next = new URLSearchParams(searchParams);
            if (v === "config") next.delete("tab");
            else next.set("tab", v);
            setSearchParams(next, { replace: true });
          }}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 sm:grid-cols-4 font-khmer-moul h-auto">
            <TabsTrigger value="config" className="text-xs sm:text-sm">Configuration</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm">Preview</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs sm:text-sm">Billing</TabsTrigger>
            <TabsTrigger value="guests" className="text-xs sm:text-sm">
              Guests {guests.length > 0 && <span className="ml-1.5 text-xs opacity-70">({guests.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <PreviewPanel
              event={{
                ...event,
                template_section_visibility: templateVisibilityBySlug[event.template] ?? {},
                template_cover_music_url: templateDefaultsBySlug[event.template]?.cover_music_url,
                dual_language_config: event.dual_language_config,
                section_visibility: {
                  ...(event.section_visibility as any),
                  dual_language: event.dual_language_config,
                },
              } as any}
              publicHref={`/${event.slug}`}
              bare
            />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <EventBillingTab
              eventId={event.id}
              currency={event.price_currency ?? "USD"}
              cachedTotal={Number(event.price_total ?? 0)}
              cachedPaid={Number(event.paid_amount ?? 0)}
              cachedStatus={event.payment_status ?? "unpaid"}
              onChanged={(next) => setEvent({ ...event, ...next })}
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6 space-y-8">

        {/* ============== Styling (moved to top per request) ============== */}

        {/* Cover background (Khmer Traditional front page) */}
        <CollapsibleSection
          title="Front-page background"
          description="Used as the full-screen backdrop on the cover (gate) screen. Leave empty to use the default ornate template background."
          defaultOpen={false}
          rightSlot={sectionSave}
        >
          <div className="flex flex-col md:flex-row gap-4 items-start pt-2">
            <div className="w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center">
              {event.cover_background_url ? (
                <img src={event.cover_background_url} alt="Background" className="h-full w-full object-cover" />
              ) : (
                <img src="/templates/khmer-traditional/background.webp" alt="Default background" className="h-full w-full object-cover opacity-90" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload background"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBackground(f); }} />
              </Label>
              {event.cover_background_url && (
                <Button variant="ghost" size="sm" onClick={async () => {
                  setEvent({ ...event, cover_background_url: null });
                  await supabase.from("events").update({ cover_background_url: null }).eq("id", event.id);
                  toast.success("Background reset to default");
                }}>
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
              {event.invite_background_url ? (
                <img src={event.invite_background_url} alt="Invitation background" className="h-full w-full object-cover" />
              ) : event.cover_background_url ? (
                <img src={event.cover_background_url} alt="Inherited from cover" className="h-full w-full object-cover opacity-90" />
              ) : (
                <img src="/templates/khmer-traditional/background.webp" alt="Default background" className="h-full w-full object-cover opacity-90" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload background"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadInviteBackground(f); }} />
              </Label>
              {event.invite_background_url && (
                <Button variant="ghost" size="sm" onClick={async () => {
                  setEvent({ ...event, invite_background_url: null });
                  await supabase.from("events").update({ invite_background_url: null }).eq("id", event.id);
                  toast.success("Reset — using cover background");
                }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Reset to cover background
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Currently: {event.invite_background_url ? "custom" : event.cover_background_url ? "inherited from cover" : "default template"}.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Text colour overrides & effects */}
        <CollapsibleSection
          title="Colours, Typography & Effects"
          description="Configure text colours, button branding, body typography, and drop shadow / glow text effects."
          defaultOpen={false}
          rightSlot={sectionSave}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Body text colour (replaces black)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={event.text_color_primary || "#000000"}
                  onChange={(e) => setEvent({ ...event, text_color_primary: e.target.value })}
                  className="h-10 w-14 rounded border border-border bg-background cursor-pointer"
                  aria-label="Body text colour"
                />
                <Input
                  value={event.text_color_primary ?? ""}
                  placeholder="#000000"
                  onChange={(e) => setEvent({ ...event, text_color_primary: e.target.value || null })}
                  className="flex-1"
                />
                {event.text_color_primary && (
                  <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, text_color_primary: null })}>
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Used for parents' names, honorifics, date, venue, agenda items &amp; body text.</p>
            </div>
            <div className="space-y-2">
              <Label>Accent colour (replaces gold)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={event.text_color_accent || "#db9b0f"}
                  onChange={(e) => setEvent({ ...event, text_color_accent: e.target.value })}
                  className="h-10 w-14 rounded border border-border bg-background cursor-pointer"
                  aria-label="Accent colour"
                />
                <Input
                  value={event.text_color_accent ?? ""}
                  placeholder="#db9b0f"
                  onChange={(e) => setEvent({ ...event, text_color_accent: e.target.value || null })}
                  className="flex-1"
                />
                {event.text_color_accent && (
                  <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, text_color_accent: null })}>
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Used for titles, couple's names, dress code, dividers, icons &amp; borders.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label>Open invitation button colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={event.open_button_color || event.text_color_accent || "#db9b0f"}
                  onChange={(e) => setEvent({ ...event, open_button_color: e.target.value })}
                  className="h-10 w-14 rounded border border-border bg-background cursor-pointer"
                  aria-label="Open invitation button colour"
                />
                <Input
                  value={event.open_button_color ?? ""}
                  placeholder={event.text_color_accent || "#db9b0f"}
                  onChange={(e) => setEvent({ ...event, open_button_color: e.target.value || null })}
                  className="flex-1"
                />
                {event.open_button_color && (
                  <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, open_button_color: null })}>
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Dedicated colour for the "Open Invitation" (បើកលិខិត) button on cover screens. Defaults to accent colour if unset.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Body font</Label>
              <Select
                value={event.body_font ?? "__default__"}
                onValueChange={(v) => setEvent({ ...event, body_font: v === "__default__" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default (Siemreap)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default (Siemreap)</SelectItem>
                  {[
                    { name: "Siemreap", label: "សៀមរាប — Siemreap" },
                    { name: "Battambang", label: "បាត់ដំបង — Battambang" },
                    { name: "Angkor", label: "អង្គរ — Angkor" },
                    { name: "Bayon", label: "បាយ័ន — Bayon" },
                    { name: "Dangrek", label: "ដងរែក — Dangrek" },
                    { name: "Koulen", label: "គូលែន — Koulen" },
                    { name: "Preahvihear", label: "ព្រះវិហារ — Preahvihear" },
                  ].map((f) => (
                    <SelectItem key={f.name} value={f.name} style={{ fontFamily: `"${f.name}", "Battambang", sans-serif` }}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Applies to the invitation's body / paragraph text. Heading fonts are unchanged.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 mt-6">
            <TextEffectsEditor
              config={event.text_effect_config}
              onChange={(text_effect_config) => setEvent({ ...event, text_effect_config })}
            />
          </div>
        </CollapsibleSection>

        {/* Ornamental side frame */}
        <CollapsibleSection
          title="Ornamental side frame"
          description="Decorative ornate frame borders (Khmer vines, royal pillars, lotus garlands) flanking the sides of the screen."
          defaultOpen={event.side_frame_config?.enabled ?? false}
          rightSlot={
            <div className="flex items-center gap-2">
              {event.side_frame_config?.enabled ? (
                <Badge variant="secondary" className="text-gold border-gold/40 bg-gold/10 text-[10px]">
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Disabled
                </Badge>
              )}
              {sectionSave}
            </div>
          }
        >
          <div className="pt-2">
            <SideFrameEditor
              config={event.side_frame_config}
              accentColor={event.text_color_accent}
              onChange={(side_frame_config) => setEvent({ ...event, side_frame_config })}
            />
          </div>
        </CollapsibleSection>

        {/* ============== End styling ============== */}

        {/* Customer access — link existing customer accounts to this event so
            they can manage it from the customer dashboard. Shown first so
            admins can grant access before configuring the rest. */}
        <CollapsibleSection
          title="Customer access"
          description="Choose which customer accounts can manage this event from the customer dashboard."
          defaultOpen={true}
        >
          <div className="pt-2 space-y-4">
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customer accounts yet. Create one from the{" "}
                <Link to="/admin/users" className="text-gold hover:underline">Users page</Link>.
              </p>
            ) : (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-auto min-h-10 py-2"
                    >
                      <div className="flex flex-wrap gap-1 items-center">
                        {linkedCustomerIds.size === 0 ? (
                          <span className="text-muted-foreground">Select customers…</span>
                        ) : (
                          customers
                            .filter(c => linkedCustomerIds.has(c.user_id))
                            .map(c => (
                              <Badge key={c.user_id} variant="secondary" className="gap-1">
                                {c.display_name || c.email || "Unnamed"}
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => { e.stopPropagation(); toggleCustomerLink(c.user_id); }}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleCustomerLink(c.user_id); } }}
                                  className="ml-1 hover:text-destructive cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </span>
                              </Badge>
                            ))
                        )}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search customers…" />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map(c => {
                            const checked = linkedCustomerIds.has(c.user_id);
                            const label = c.display_name || c.email || "Unnamed";
                            return (
                              <CommandItem
                                key={c.user_id}
                                value={`${label} ${c.email ?? ""}`}
                                onSelect={() => toggleCustomerLink(c.user_id)}
                              >
                                <Check className={`mr-2 h-4 w-4 ${checked ? "opacity-100" : "opacity-0"}`} />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{label}</div>
                                  {c.email && c.display_name && (
                                    <div className="text-xs truncate">{c.email}</div>
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {linkedCustomerIds.size} customer{linkedCustomerIds.size === 1 ? "" : "s"} linked.
                  </p>
                  <Button
                    onClick={saveCustomerAccess}
                    disabled={savingCustomers}
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingCustomers ? "Saving…" : "Save customer access"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Per-section visibility — toggles override the template defaults. */}
        <CollapsibleSection
          title="Section visibility"
          description="Show or hide each section on the invitation. Defaults follow the selected template; flip a switch to override per event."
          defaultOpen={false}
          rightSlot={sectionSave}
        >
          <div className="pt-2">
            <SectionVisibilityEditor
              value={event.section_visibility}
              templateDefaults={templateVisibilityBySlug[event.template] ?? {}}
              onChange={(next) => setEvent({ ...event, section_visibility: next })}
            />
          </div>
        </CollapsibleSection>

        {/* Dual language toggle and settings */}
        <CollapsibleSection
          title="Dual language (ភាសាខ្មែរ / English)"
          description="Global configuration for bilingual support. Choose whether guests can switch languages and select the default language. All content fields below will automatically adapt."
          defaultOpen={event.dual_language_config?.enabled ?? false}
          rightSlot={sectionSave}
        >
          <div className="pt-2">
            <DualLanguageEditor
              config={event.dual_language_config ?? { enabled: false, default_language: "km", km: {}, en: {} }}
              baseEvent={event}
              onChange={(nextCfg) => setEvent({ ...event, dual_language_config: nextCfg })}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Event details" defaultOpen={true} rightSlot={sectionSave}>
          <div className="grid gap-4 md:grid-cols-2 pt-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Internal title <span className="text-xs text-muted-foreground font-normal">(admin only — not shown to guests)</span></Label>
              <Input
                value={event.internal_title ?? ""}
                onChange={e => setEvent({ ...event, internal_title: e.target.value || null })}
                placeholder="e.g. Sathya & Nika — Aeon Hall reception"
              />
              <p className="text-xs text-muted-foreground">Helps you identify this event/customer in the events list. The public invitation always shows the Title below.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualInput
                label="Title (shown on invitation)"
                isDual={isDual}
                kmValue={event.title}
                enValue={event.dual_language_config?.en?.title ?? ""}
                onKmChange={(val) => setEvent({ ...event, title: val })}
                onEnChange={(val) => updateEnField("title", val)}
                placeholderKm="អាពាហ៍ពិពាហ៍ សត្យា & នីកា"
                placeholderEn="Wedding of Sathya & Nika"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={event.slug} onChange={e => setEvent({ ...event, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={event.template}
                onValueChange={(v) => {
                  // Copy the new template's default section-visibility map
                  // into the event so the toggles start from those defaults
                  // (and the user can still override individual sections
                  // afterwards). This is a one-time apply on switch — the
                  // event keeps its own overrides going forward.
                  const tplDefaults = templateVisibilityBySlug[v] ?? {};
                  setEvent({ ...event, template: v, section_visibility: { ...tplDefaults } });
                  toast.success("Template applied — section visibility copied from template defaults");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.label} {t.description && <span className="text-muted-foreground text-xs">— {t.description}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Switching templates copies that template's section toggles onto this event. You can then customise them below.</p>
            </div>
            <div className="space-y-2">
              <Label>Event date</Label>
              <Input type="date" value={dtLocal}
                onChange={e => setEvent({ ...event, event_date: e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : null })} />
            </div>
            <div className="space-y-2">
              <Label>Access starts</Label>
              <Input
                type="date"
                value={event.access_starts_at ? new Date(event.access_starts_at).toISOString().slice(0, 10) : ""}
                onChange={e => setEvent({ ...event, access_starts_at: e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : null })}
              />
              <p className="text-xs text-muted-foreground">Before this date the invitation page is hidden.</p>
            </div>
            <div className="space-y-2">
              <Label>Access ends</Label>
              <Input
                type="date"
                value={event.access_ends_at ? new Date(event.access_ends_at).toISOString().slice(0, 10) : ""}
                onChange={e => setEvent({ ...event, access_ends_at: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : null })}
              />
              <p className="text-xs text-muted-foreground">After this date the invitation page is hidden. Leave both blank to keep it always available.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <ParentsEditor
                groomName={event.groom_name}
                brideName={event.bride_name}
                isDual={isDual}
                enGroomName={event.dual_language_config?.en?.groom_name}
                enBrideName={event.dual_language_config?.en?.bride_name}
                onChange={({ groom_name, bride_name }) =>
                  setEvent({ ...event, groom_name, bride_name })
                }
                onEnChange={({ groom_name, bride_name }) => {
                  if (!event) return;
                  const currentDual = event.dual_language_config ?? { enabled: false, default_language: "km", km: {}, en: {} };
                  setEvent({
                    ...event,
                    dual_language_config: {
                      ...currentDual,
                      en: {
                        ...currentDual.en,
                        groom_name,
                        bride_name,
                      },
                    },
                  });
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Tip: You can upload the couple's wedding logo or monogram emblem in the <strong>Groom &amp; Bride Logo / Monogram</strong> section below.
              </p>
            </div>
            <div className="space-y-2">
              <BilingualInput
                label="Ceremony time"
                isDual={isDual}
                kmValue={event.ceremony_time ?? ""}
                enValue={event.dual_language_config?.en?.ceremony_time ?? ""}
                onKmChange={(val) => setEvent({ ...event, ceremony_time: val })}
                onEnChange={(val) => updateEnField("ceremony_time", val)}
                placeholderKm="6:00 ព្រឹក"
                placeholderEn="6:00 AM"
              />
            </div>
            <div className="space-y-2">
              <BilingualInput
                label="Reception time"
                isDual={isDual}
                kmValue={event.reception_time ?? ""}
                enValue={event.dual_language_config?.en?.reception_time ?? ""}
                onKmChange={(val) => setEvent({ ...event, reception_time: val })}
                onEnChange={(val) => updateEnField("reception_time", val)}
                placeholderKm="6:00 ល្ងាច"
                placeholderEn="6:00 PM"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualInput
                label="Venue name"
                isDual={isDual}
                kmValue={(event.venue ?? "").split("|")[0]}
                enValue={event.dual_language_config?.en?.venue ?? ""}
                onKmChange={(val) => {
                  const link = (event.venue ?? "").split("|").slice(1).join("|");
                  const next = link ? `${val}|${link}` : val;
                  setEvent({ ...event, venue: next || null });
                }}
                onEnChange={(val) => updateEnField("venue", val)}
                placeholderKm="សណ្ឋាគារ សូហ្វីតែល ភ្នំពេញ ភូគីត្រា"
                placeholderEn="Sofitel Phnom Penh Phokeethra"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Venue link (Google Maps URL)</Label>
              <Input
                value={(event.venue ?? "").split("|").slice(1).join("|")}
                onChange={(e) => {
                  const name = (event.venue ?? "").split("|")[0] ?? "";
                  const next = e.target.value ? `${name}|${e.target.value}` : name;
                  setEvent({ ...event, venue: next || null });
                }}
                placeholder="https://maps.app.goo.gl/…"
              />
              <p className="text-xs text-muted-foreground">
                Optional. When provided, the venue name becomes a clickable link and the map button opens this URL.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Custom Google Maps embed (iframe or URL)</Label>
              <Textarea
                rows={3}
                value={event.map_embed ?? ""}
                onChange={(e) => setEvent({ ...event, map_embed: e.target.value || null })}
                placeholder={'<iframe src="https://www.google.com/maps/embed?…" …></iframe>\n— or just the src URL'}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Paste the full <code>&lt;iframe&gt;</code> snippet from Google Maps → Share → Embed a map, or just the embed URL. When set, this overrides the auto-generated map for the location section.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Map image (PNG/JPG)</Label>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {event.map_image_url ? (
                  <img src={event.map_image_url} alt="Map" className="h-24 w-40 object-cover rounded-md border bg-white shrink-0" />
                ) : (
                  <div className="h-24 w-40 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    No map image
                  </div>
                )}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadMapImage(f); }}
                  />
                  {event.map_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => setEvent({ ...event, map_image_url: null })}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Shown below the embedded map at the same width. Guests can tap to view full-screen and zoom in.
              </p>
            </div>
            <div className="space-y-2">
              <BilingualInput
                label="Dress code"
                isDual={isDual}
                kmValue={event.dress_code ?? ""}
                enValue={event.dual_language_config?.en?.dress_code ?? ""}
                onKmChange={(val) => setEvent({ ...event, dress_code: val })}
                onEnChange={(val) => updateEnField("dress_code", val)}
                placeholderKm="សមរម្យ / ប្រពៃណី"
                placeholderEn="Formal / Traditional"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum guests (optional)</Label>
              <Input
                type="number"
                min={1}
                value={event.max_guests ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  const n = v ? Math.max(1, parseInt(v, 10) || 0) : null;
                  setEvent({ ...event, max_guests: n });
                }}
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no limit. Currently {guests.length} guest{guests.length === 1 ? "" : "s"} added.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input
                value={event.contact_phone ?? "+855 "}
                onChange={e => {
                  const next = e.target.value;
                  // Always keep +855 country prefix.
                  const normalized = next.startsWith("+855")
                    ? next
                    : `+855 ${next.replace(/^\+?855\s*/, "")}`;
                  setEvent({ ...event, contact_phone: normalized });
                }}
                placeholder="+855 12 345 678"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualTextarea
                label="Honorific invitation lines (max 4)"
                description="One line per row, up to 4 rows. Leave blank to use the traditional default text."
                rows={4}
                isDual={isDual}
                kmValue={event.cover_message ?? ""}
                enValue={event.dual_language_config?.en?.cover_message ?? ""}
                onKmChange={(val) => {
                  const lines = val.split(/\r?\n/).slice(0, 4).join("\n");
                  setEvent({ ...event, cover_message: lines });
                }}
                onEnChange={(val) => {
                  const lines = val.split(/\r?\n/).slice(0, 4).join("\n");
                  updateEnField("cover_message", lines);
                }}
                placeholderKm={"ឯកឧត្តម លោកឧកញ្ញ៉ា លោកជំទាវ លោក​ លោកស្រី អ្នកនាង កញ្ញាអញ្ចើញចូលរួម\nជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរិសួស្តីជ័យមង្គល​\nក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ"}
                placeholderEn={"Cordially invite you to celebrate the wedding ceremony of our son and daughter\nas honored guests to grace the blessed auspicious occasion"}
                className="text-center"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualInput
                label="Countdown headline"
                description={<>Shown above the countdown number on the invitation. Leave blank for the default phrase. The line below changes automatically: <strong>X ថ្ងៃទៀត / Days left</strong> before the event.</>}
                isDual={isDual}
                kmValue={event.countdown_message ?? ""}
                enValue={event.dual_language_config?.en?.countdown_message ?? ""}
                onKmChange={(val) => {
                  const oneLine = val.replace(/[\r\n]+/g, " ");
                  setEvent({ ...event, countdown_message: oneLine });
                }}
                onEnChange={(val) => {
                  const oneLine = val.replace(/[\r\n]+/g, " ");
                  updateEnField("countdown_message", oneLine);
                }}
                placeholderKm="អ្នកត្រូវបានអញ្ជើញមកចូលរួមក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ!"
                placeholderEn="You are cordially invited to celebrate our wedding day!"
                inputClassName="text-center"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualTextarea
                label="Description"
                rows={3}
                isDual={isDual}
                kmValue={event.description ?? ""}
                enValue={event.dual_language_config?.en?.description ?? ""}
                onKmChange={(val) => setEvent({ ...event, description: val })}
                onEnChange={(val) => updateEnField("description", val)}
                placeholderKm="ព័ត៌មានបន្ថែមអំពីកម្មវិធី..."
                placeholderEn="Additional wedding details or message to guests..."
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* QR code (gift transfer) + Apologies + Thank-you letter editors */}
        {/* QR code (gift transfer) — uploaded image + editable message + account name. */}
        <CollapsibleSection title="QR code for gift transfer" defaultOpen={false} rightSlot={sectionSave}>
          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>QR code image</Label>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {event.qr_code_url ? (
                  <img src={event.qr_code_url} alt="QR" className="h-24 w-24 object-contain rounded-md border bg-white p-1 shrink-0" />
                ) : (
                  <div className="h-24 w-24 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    No QR
                  </div>
                )}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadQrCode(f); }}
                  />
                  {event.qr_code_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => setEvent({ ...event, qr_code_url: null })}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Upload a square QR image (PNG/JPG). Recommended ≥ 600 × 600 px.</p>
            </div>
            <div className="space-y-2">
              <BilingualInput
                label="Account holder name"
                description="Shown under the QR. Leave blank to hide."
                isDual={isDual}
                kmValue={event.qr_account_name ?? ""}
                enValue={event.dual_language_config?.en?.qr_account_name ?? ""}
                onKmChange={(val) => setEvent({ ...event, qr_account_name: val })}
                onEnChange={(val) => updateEnField("qr_account_name", val)}
                placeholderKm="ឈ្មោះម្ចាស់គណនី"
                placeholderEn="ACCOUNT HOLDER NAME"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <BilingualTextarea
                label="QR description message"
                description="Leave blank to use the default text."
                rows={3}
                isDual={isDual}
                kmValue={event.qr_code_message ?? ""}
                enValue={event.dual_language_config?.en?.qr_code_message ?? ""}
                onKmChange={(val) => setEvent({ ...event, qr_code_message: val })}
                onEnChange={(val) => updateEnField("qr_code_message", val)}
                placeholderKm="លោកអ្នកក៏អាចផ្ញើចំណងដៃតាមរយៈគណនី QR code របស់ពួកយើង រឺចុចប៊ូតុងខាងក្រោម។"
                placeholderEn="You may also send your wedding gift by scanning our ABA/Bakong QR code or tapping the button below."
                className="font-khmer-siemreap"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Apologies letter" defaultOpen={false} rightSlot={sectionSave}>
          <div className="pt-2 space-y-4">
            <div className="space-y-2">
              <BilingualTextarea
                label="Apologies message"
                description="The heading is fixed. Edit only the body. Leave blank to use the traditional default text."
                rows={8}
                isDual={isDual}
                kmValue={event.apologies_message ?? ""}
                enValue={event.dual_language_config?.en?.apologies_message ?? ""}
                onKmChange={(val) => setEvent({ ...event, apologies_message: val })}
                onEnChange={(val) => updateEnField("apologies_message", val)}
                placeholderKm="យើងខ្ញុំជាមាតាបិតា​ កូនប្រុស កូនស្រី សូមអភ័យទោស..."
                placeholderEn="We, the parents, groom and bride, sincerely apologize if we were unable to invite or welcome you in person..."
                className="font-khmer-siemreap"
              />
            </div>
            <LetterCardStyleEditor
              color={event.letter_bg_color}
              opacity={event.letter_bg_opacity}
              onChange={(patch) => setEvent({ ...event, ...patch })}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Thank-you letter" defaultOpen={false} rightSlot={sectionSave}>
          <div className="pt-2 space-y-4">
            <div className="space-y-2">
              <BilingualTextarea
                label="Thank-you message"
                description="The heading is fixed. Edit only the body. Leave blank to use the default thank-you letter."
                rows={8}
                isDual={isDual}
                kmValue={event.thank_you_message ?? ""}
                enValue={event.dual_language_config?.en?.thank_you_message ?? ""}
                onKmChange={(val) => setEvent({ ...event, thank_you_message: val })}
                onEnChange={(val) => updateEnField("thank_you_message", val)}
                placeholderKm="យើងខ្ញុំជាមាតាបិតា កូនប្រុស កូនស្រី សូមថ្លែងអំណរគុណ..."
                placeholderEn="We, the parents and newlywed couple, express our deepest gratitude and heartfelt appreciation for your blessings and presence..."
                className="font-khmer-siemreap"
              />
            </div>
            <LetterCardStyleEditor
              color={event.letter_bg_color}
              opacity={event.letter_bg_opacity}
              onChange={(patch) => setEvent({ ...event, ...patch })}
            />
          </div>
        </CollapsibleSection>

        {/* Agenda editor (multi-day, list/card view) */}
        <CollapsibleSection title="Agenda" defaultOpen={false} rightSlot={sectionSave}>
          <div className="pt-2">
            <AgendaEditor
              days={event.agenda_days}
              viewStyle={event.agenda_view_style}
              isDual={isDual}
              assetColor={event.agenda_asset_color}
              bgColor={event.agenda_bg_color}
              bgOpacity={event.agenda_bg_opacity}
              onChange={(days) => setEvent({ ...event, agenda_days: days })}
              onChangeViewStyle={(v) => setEvent({ ...event, agenda_view_style: v })}
              onChangeStyle={(patch) => setEvent({ ...event, ...patch })}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Tip: Save changes below to publish your agenda.
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Photo gallery"
          description={<>Up to 24 photos. Each file may be up to <span className="text-gold">12 MB</span> for high-quality lightbox view — guests see a fast thumbnail and the full image only when they tap a photo. Drag the <GripVertical className="inline h-3 w-3 align-[-2px]" /> handle to reorder.</>}
          rightSlot={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{(event.gallery_urls?.length ?? 0)} / 24</span>
              {sectionSave}
            </div>
          }
          defaultOpen={false}
        >
          <div className="pt-2 space-y-4">
            <p className="text-[11px] text-muted-foreground">
              Mosaic layout: 1 portrait + 2 landscape per group of 3. Extra photos that don't complete a group are hidden on the invitation.
            </p>

            {event.gallery_urls && event.gallery_urls.length > 0 && (
              <DndContext sensors={gallerySensors} collisionDetection={closestCenter} onDragEnd={onGalleryDragEnd}>
                <SortableContext
                  items={event.gallery_urls.map((_, i) => `g-${i}`)}
                  strategy={rectSortingStrategy}
                >
                  {(() => {
                    const urls = event.gallery_urls;
                    const fullCount = Math.floor(urls.length / 3) * 3;
                    const groups = Array.from({ length: fullCount / 3 }, (_, gi) => urls.slice(gi * 3, gi * 3 + 3));
                    const leftover = urls.slice(fullCount);
                    return (
                      <div className="space-y-3 mb-4 max-w-sm">
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
                              className="grid grid-cols-2 grid-rows-2 gap-1.5"
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
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 opacity-60">
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

            {event.gallery_urls && event.gallery_urls.length > 0 && (
              <div className="rounded-md border border-gold/20 bg-gold/5 p-3 space-y-2">
                <div className="text-xs font-medium text-gold">Share link preview image</div>
                <p className="text-[11px] text-muted-foreground">
                  Pick which photo appears when this invitation link is shared on Telegram, Facebook, etc. Defaults to the first photo.
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {event.gallery_urls.map((url, idx) => {
                    const selected = (event.share_preview_index ?? 0) === idx;
                    return (
                      <button
                        type="button"
                        key={`sp-${idx}-${url}`}
                        onClick={() => setEvent({ ...event, share_preview_index: idx })}
                        className={`relative aspect-square overflow-hidden rounded border-2 transition ${
                          selected ? "border-gold ring-2 ring-gold/40" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={selected ? "Selected as share preview" : "Use as share preview"}
                      >
                        <img src={thumbUrl(url, 120)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        {selected && (
                          <span className="absolute bottom-0 inset-x-0 bg-gold text-[9px] text-center text-background py-0.5">
                            Preview
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Remember to click <span className="text-gold">Save</span> after changing this. Social platforms cache previews — test with a fresh link.
                </p>
              </div>
            )}

            <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading || (event.gallery_urls?.length ?? 0) >= 24}
                onChange={(e) => { const f = e.target.files; if (f && f.length) handleUploadGallery(f); e.currentTarget.value = ""; }}
              />
            </Label>
          </div>
        </CollapsibleSection>

        {/* Contacts editor */}
        <CollapsibleSection title="Contacts" defaultOpen={false} rightSlot={sectionSave}>
          <div className="pt-2">
            <ContactsEditor
              contacts={event.contacts}
              isDual={isDual}
              onChange={(contacts) => setEvent({ ...event, contacts })}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Tip: Save changes below to publish your contacts. The legacy “Contact phone” field is still respected as a fallback.
            </p>
          </div>
        </CollapsibleSection>

        {/* Groom & Bride Logo / Monogram (Cover & Invitation) */}
        <CollapsibleSection title="Groom & Bride Logo / Monogram (Cover & Invitation)" defaultOpen={false} rightSlot={sectionSave}>
          <div className="pt-1 pb-2">
            <p className="text-xs text-muted-foreground mb-4">
              Upload the wedding logo or couple's monogram emblem (PNG with transparent background or gold crest recommended).
              This appears prominently as the central emblem on the <strong>Cover Screen</strong> and directly above the couple's names on the <strong>Invitation Page</strong>.
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-secondary/60 border border-dashed border-border flex items-center justify-center p-4">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt="Groom & Bride Logo / Monogram" className="max-h-full max-w-full object-contain drop-shadow" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground opacity-50">
                    <ImageIcon className="h-9 w-9" />
                    <span className="text-[11px]">No logo / monogram uploaded</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Upload logo / monogram"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadCover(f); }} />
                </Label>
                {event.cover_image_url && (
                  <Button variant="ghost" size="sm" onClick={async () => {
                    setEvent({ ...event, cover_image_url: null });
                    await supabase.from("events").update({ cover_image_url: null }).eq("id", event.id);
                    toast.success("Logo removed");
                  }}>
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
                  normalizeTextEffectConfig(
                    (event as any).text_effect_config ?? (event as any).section_visibility?.text_effects
                  ).monogram
                }
                onChange={(monogramSettings) => {
                  const currentNorm = normalizeTextEffectConfig(
                    (event as any).text_effect_config ?? (event as any).section_visibility?.text_effects
                  );
                  const updatedTextEffect = { ...currentNorm, monogram: monogramSettings };
                  setEvent({
                    ...event,
                    text_effect_config: updatedTextEffect,
                    section_visibility: {
                      ...((event as any).section_visibility ?? {}),
                      text_effects: updatedTextEffect,
                    },
                  } as any);
                }}
                monogramUrl={event.cover_image_url}
                accentColor={event.text_color_accent}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Colours, Typography & Text Effects */}
        <CollapsibleSection
          title="Colours, Typography &amp; Effects"
          description="Customise typography fonts, font colours, open invitation button styling, and separate text drop shadows / glow effects."
          defaultOpen={false}
          rightSlot={sectionSave}
        >
          <div className="space-y-6 pt-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Body text colour</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="w-16 h-10 p-1"
                    value={event.text_color_primary ?? "#3b1d12"}
                    onChange={e => setEvent({ ...event, text_color_primary: e.target.value })}
                  />
                  <Input
                    value={event.text_color_primary ?? ""}
                    onChange={e => setEvent({ ...event, text_color_primary: e.target.value || null })}
                    placeholder="#3b1d12"
                  />
                  {event.text_color_primary && (
                    <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, text_color_primary: null })}>Reset</Button>
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
                    value={event.text_color_accent ?? "#c89b3c"}
                    onChange={e => setEvent({ ...event, text_color_accent: e.target.value })}
                  />
                  <Input
                    value={event.text_color_accent ?? ""}
                    onChange={e => setEvent({ ...event, text_color_accent: e.target.value || null })}
                    placeholder="#c89b3c"
                  />
                  {event.text_color_accent && (
                    <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, text_color_accent: null })}>Reset</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Used for titles, couple's names, dress code, dividers, icons &amp; borders.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Open invitation button colour</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="w-16 h-10 p-1"
                    value={event.open_button_color || event.text_color_accent || "#c89b3c"}
                    onChange={e => setEvent({ ...event, open_button_color: e.target.value })}
                  />
                  <Input
                    value={event.open_button_color ?? ""}
                    onChange={e => setEvent({ ...event, open_button_color: e.target.value || null })}
                    placeholder={event.text_color_accent || "#c89b3c"}
                  />
                  {event.open_button_color && (
                    <Button variant="ghost" size="sm" onClick={() => setEvent({ ...event, open_button_color: null })}>Reset</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Dedicated colour for the "Open Invitation" (បើកលិខិត) button on cover screens. Defaults to accent colour if unset.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FontSelector
                  type="header"
                  label="Heading &amp; Title Font"
                  value={event.header_font ?? null}
                  onChange={(header_font) => setEvent({ ...event, header_font })}
                  accentColor={event.text_color_accent}
                  description="Applied to the main title, couple names, honorific headings, and section headers."
                />
                <FontSelector
                  type="body"
                  label="Body &amp; Paragraph Font"
                  value={event.body_font ?? null}
                  onChange={(body_font) => setEvent({ ...event, body_font })}
                  accentColor={event.text_color_accent}
                  description="Applied to letters of apology, gratitude, invitations, dates, and agenda descriptions."
                />
              </div>

              <TextEffectsEditor
                config={normalizeTextEffectConfig(event.text_effect_config)}
                onChange={(text_effect_config) => setEvent({ ...event, text_effect_config })}
                accentColor={event.text_color_accent}
                primaryColor={event.text_color_primary}
                headerFont={event.header_font}
                bodyFont={event.body_font}
                monogramUrl={event.cover_image_url}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Ornamental side frame */}
        <CollapsibleSection
          title="Ornamental side frame"
          description="Decorative ornate frame borders (Khmer vines, royal pillars, lotus garlands) flanking the sides of the screen."
          defaultOpen={event.side_frame_config?.enabled ?? false}
          rightSlot={sectionSave}
        >
          <div className="pt-2">
            <SideFrameEditor
              config={normalizeSideFrameConfig(event.side_frame_config)}
              onChange={(side_frame_config) => setEvent({ ...event, side_frame_config })}
            />
          </div>
        </CollapsibleSection>

        {/* Background music configuration — available for all templates */}
        <CollapsibleSection
          title="Background music"
          description="Ambient soundtrack played while guests browse the invitation. Supports MP3 upload, preset tracks, or custom audio links."
          defaultOpen={false}
          rightSlot={sectionSave}
        >
          <MusicEditor
            musicUrl={event.cover_music_url}
            onChange={async (url) => {
              setEvent({ ...event, cover_music_url: url });
              await supabase.from("events").update({ cover_music_url: url }).eq("id", event.id);
            }}
            onUpload={handleUploadCoverMusic}
            uploading={uploading}
            autoPlayCover={
              normalizeMusicSettings({
                autoPlayCover: (event as any).music_autoplay_cover ?? (event as any).section_visibility?.music_autoplay_cover,
                autoPlayInvitation: (event as any).music_autoplay_invitation ?? (event as any).section_visibility?.music_autoplay_invitation,
                music_autoplay_mode: (event as any).music_autoplay_mode ?? (event as any).section_visibility?.music_autoplay_mode,
              }).autoPlayCover
            }
            autoPlayInvitation={
              normalizeMusicSettings({
                autoPlayCover: (event as any).music_autoplay_cover ?? (event as any).section_visibility?.music_autoplay_cover,
                autoPlayInvitation: (event as any).music_autoplay_invitation ?? (event as any).section_visibility?.music_autoplay_invitation,
                music_autoplay_mode: (event as any).music_autoplay_mode ?? (event as any).section_visibility?.music_autoplay_mode,
              }).autoPlayInvitation
            }
            onAutoPlayChange={async (settings) => {
              const currentVis = (event.section_visibility as any) ?? {};
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
              setEvent({
                ...event,
                music_autoplay_cover: settings.autoPlayCover,
                music_autoplay_invitation: settings.autoPlayInvitation,
                music_autoplay_mode: updatedVis.music_autoplay_mode,
                section_visibility: updatedVis,
              } as any);
              await supabase.from("events").update({
                section_visibility: updatedVis as any,
              }).eq("id", event.id);
              toast.success("Music autoplay settings updated");
            }}
          />
        </CollapsibleSection>
          </TabsContent>

          <TabsContent value="guests" className="mt-6 space-y-8">

        {/* RSVP stats — 4 columns on mobile (compact) so the entire snapshot
            is visible above the fold; expands at sm: with larger numbers. */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Attending", value: stats.yes },
            { label: "Declined", value: stats.no },
            { label: "Pending", value: stats.pending },
          ].map(s => (
            <div key={s.label} className="p-2 sm:p-4 rounded-lg border border-border bg-card text-center">
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground truncate">{s.label}</div>
              <div className="font-serif text-xl sm:text-3xl text-gradient-gold mt-0.5 sm:mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Guests */}
        <CollapsibleSection
          title="Guests"
          rightSlot={
            <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadGuestTemplate}
                title="Download a blank Excel template"
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Template</span>
              </Button>
              <Label
                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-md border border-input bg-background text-sm hover:bg-secondary/50 transition-colors"
                title="Import guests from an Excel file"
              >
                <FileUp className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importGuestsExcel(f);
                    e.currentTarget.value = "";
                  }}
                />
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={exportGuestsExcel}
                disabled={guests.length === 0}
                title="Export the current guest list to Excel"
              >
                <FileDown className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Add guests</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddGuests} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Names (one per line)</Label>
                      <Textarea rows={8} value={bulkNames} onChange={e => setBulkNames(e.target.value)}
                        placeholder="One name per line" required
                        className="font-khmer-siemreap" />
                      <p className="text-xs text-muted-foreground">
                        Each guest gets a unique secure invitation link. Links never expire and can be opened any number of times.
                        {event.max_guests != null && (
                          <> Limit: <span className="text-gold">{guests.length} / {event.max_guests}</span>.</>
                        )}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                        Create guests
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          }
          defaultOpen={true}
        >
          <div className="-mx-6 -mb-6">
            {/* Search + filter toolbar */}
            {guests.length > 0 && (
              <div className="px-5 py-3 border-y border-border flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={guestSearch}
                    onChange={e => setGuestSearch(e.target.value)}
                    placeholder="Search by name or message…"
                    className="pl-8 font-khmer-siemreap"
                  />
                </div>
                <div className="inline-flex rounded-md border border-border overflow-hidden flex-wrap">
                  {(["all", "yes", "no", "pending", "sent", "unsent"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setGuestFilter(f)}
                      className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs uppercase tracking-wide transition-colors ${
                        guestFilter === f
                          ? "bg-gold/15 text-gold"
                          : "text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {f === "all" ? "All" : f === "yes" ? "Attending" : f === "no" ? "Declined" : f === "pending" ? "Pending" : f === "sent" ? "Sent" : "Not sent"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const q = guestSearch.trim().toLowerCase();
              const filtered = guests.filter(g => {
                if (guestFilter === "sent" && !g.invite_sent_at) return false;
                if (guestFilter === "unsent" && g.invite_sent_at) return false;
                if (["yes", "no", "pending"].includes(guestFilter) && g.rsvp_status !== guestFilter) return false;
                if (!q) return true;
                return (
                  g.name.toLowerCase().includes(q) ||
                  (g.message ?? "").toLowerCase().includes(q)
                );
              });

              if (guests.length === 0) {
                return (
                  <div className="p-12 text-center text-sm text-muted-foreground">
                    No guests yet. Add some to start sharing invitations.
                  </div>
                );
              }
              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center text-sm text-muted-foreground">
                    No guests match your search or filter.
                  </div>
                );
              }
              const filteredIds = filtered.map(g => g.id);
              const selectedInView = filteredIds.filter(id => selectedGuestIds.has(id));
              const allSelected = filteredIds.length > 0 && selectedInView.length === filteredIds.length;
              const someSelected = selectedInView.length > 0 && !allSelected;
              return (
                <>
                  {selectedGuestIds.size > 0 && (
                    <div className="px-5 py-2.5 bg-secondary/40 border-b border-border flex items-center justify-between gap-3">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{selectedGuestIds.size}</span> selected
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={clearSelection} disabled={bulkDeleting}>
                          Clear
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={bulkRemoveSelected}
                          disabled={bulkDeleting}
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">{bulkDeleting ? "Removing…" : "Delete selected"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Mobile card list — guest rows collapse into stacked cards
                      with full-width action row, removing horizontal scroll. */}
                  <div className="sm:hidden divide-y divide-border">
                    <div className="px-5 py-2 flex items-center gap-3 bg-secondary/20 border-b border-border">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(v) => setAllSelected(filteredIds, v === true)}
                        aria-label="Select all visible guests"
                      />
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Select all ({filtered.length})
                      </span>
                    </div>
                    {filtered.map(g => {
                      const isEditing = editingGuestId === g.id;
                      const isSelected = selectedGuestIds.has(g.id);
                      return (
                        <div key={g.id} className={`px-5 py-4 space-y-3 ${isSelected ? "bg-secondary/30" : ""}`}>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                autoFocus
                                value={editingGuestName}
                                onChange={e => setEditingGuestName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveEditGuest(g);
                                  if (e.key === "Escape") cancelEditGuest();
                                }}
                                className="h-8 font-khmer-siemreap"
                              />
                              <Button size="icon" variant="ghost" onClick={() => saveEditGuest(g)} title="Save">
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={cancelEditGuest} title="Cancel">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleGuestSelected(g.id)}
                                aria-label={`Select ${g.name}`}
                                className="mt-1"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium font-khmer-siemreap break-words">{g.name}</div>
                                {g.message && (
                                  <div className="text-xs text-muted-foreground mt-0.5 italic font-khmer-siemreap break-words">
                                    "{g.message}"
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                                  <RsvpBadge status={g.rsvp_status} />
                                  {g.invite_sent_at && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] uppercase tracking-wide">
                                      <Send className="h-3 w-3" /> Sent
                                    </span>
                                  )}
                                  <span>· Party {g.party_size}</span>
                                  {g.responded_at && <span>· {formatDateTime(g.responded_at)}</span>}
                                </div>
                              </div>
                            </div>
                          )}
                          {!isEditing && (
                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/40">
                              <Button variant="ghost" size="icon" onClick={() => startEditGuest(g)} title="Edit name">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => copyLink(g.token)} title="Copy invitation link">
                                <Copy className="h-4 w-4 text-gold" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleSent(g)} title={g.invite_sent_at ? "Mark as not sent" : "Mark as sent"}>
                                {g.invite_sent_at ? <Undo2 className="h-4 w-4 text-muted-foreground" /> : <Send className="h-4 w-4 text-gold" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => regenerate(g)} title="Regenerate token">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeGuest(g)} title="Remove">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table — unchanged structure, just hidden below sm. */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                          <th className="p-4 font-medium w-10">
                            <Checkbox
                              checked={allSelected ? true : someSelected ? "indeterminate" : false}
                              onCheckedChange={(v) => setAllSelected(filteredIds, v === true)}
                              aria-label="Select all visible guests"
                            />
                          </th>
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">RSVP</th>
                          <th className="text-left p-4 font-medium hidden md:table-cell">Party</th>
                          <th className="text-left p-4 font-medium hidden lg:table-cell">Responded</th>
                          <th className="text-right p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filtered.map(g => {
                          const isEditing = editingGuestId === g.id;
                          const isSelected = selectedGuestIds.has(g.id);
                          return (
                            <tr key={g.id} className={`hover:bg-secondary/30 transition-smooth ${isSelected ? "bg-secondary/30" : ""}`}>
                              <td className="p-4 align-middle">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleGuestSelected(g.id)}
                                  aria-label={`Select ${g.name}`}
                                />
                              </td>
                              <td className="p-4">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      autoFocus
                                      value={editingGuestName}
                                      onChange={e => setEditingGuestName(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") saveEditGuest(g);
                                        if (e.key === "Escape") cancelEditGuest();
                                      }}
                                      className="h-8 font-khmer-siemreap"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => saveEditGuest(g)} title="Save">
                                      <Check className="h-4 w-4 text-success" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={cancelEditGuest} title="Cancel">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-medium font-khmer-siemreap">{g.name}</div>
                                    {g.message && <div className="text-xs text-muted-foreground mt-0.5 italic font-khmer-siemreap">"{g.message}"</div>}
                                  </>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <RsvpBadge status={g.rsvp_status} />
                                  {g.invite_sent_at && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] uppercase tracking-wide" title={`Sent ${formatDateTime(g.invite_sent_at)}`}>
                                      <Send className="h-3 w-3" /> Sent
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 hidden md:table-cell">{g.party_size}</td>
                              <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                                {g.responded_at ? formatDateTime(g.responded_at) : "—"}
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex gap-1">
                                  {!isEditing && (
                                    <Button variant="ghost" size="icon" onClick={() => startEditGuest(g)} title="Edit name">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={() => copyLink(g.token)} title="Copy invitation link">
                                    <Copy className="h-4 w-4 text-gold" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => toggleSent(g)} title={g.invite_sent_at ? "Mark as not sent" : "Mark as sent"}>
                                    {g.invite_sent_at ? <Undo2 className="h-4 w-4 text-muted-foreground" /> : <Send className="h-4 w-4 text-gold" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => regenerate(g)} title="Regenerate token">
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => removeGuest(g)} title="Remove">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </CollapsibleSection>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
