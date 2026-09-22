import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Sparkles, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TemplateRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  base_renderer: string;
  is_active: boolean;
  position: number;
  updated_at: string;
};

const DEFAULT_CONFIG = {
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
  ceremony_time: null,
  reception_time: null,
  dress_code: null,
  contact_phone: null,
  bride_name: null,
  groom_name: null,
  agenda_days: [],
  agenda_view_style: "list",
  contacts: [],
  map_embed: null,
  text_color_primary: null,
  text_color_accent: null,
  sample_guest_name: "Honoured Guest",
};

export default function Templates() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("id, slug, label, description, base_renderer, is_active, position, updated_at")
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as TemplateRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.label.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const addTemplate = async () => {
    setCreating(true);
    const baseSlug = `custom-${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await supabase
      .from("templates")
      .insert({
        slug: baseSlug,
        label: "New template",
        description: "Describe this template",
        base_renderer: "essentials-package-01",
        position: rows.length,
        config: DEFAULT_CONFIG as any,
      })
      .select()
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Template created");
    navigate(`/admin/templates/${(data as TemplateRow).id}`);
  };

  const removeTemplate = async (row: TemplateRow) => {
    if (!confirm(`Delete "${row.label}"? Events still using this template will keep the slug stored on the event row.`)) return;
    const { error } = await supabase.from("templates").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Template deleted");
    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-widest uppercase mb-3">
              <Sparkles className="h-3 w-3" /> Design library
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl">Invitation templates</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Each template has its own name, description and sample event configuration. Open a template to edit
              its fields and preview the result — these settings drive the live preview and become the defaults when
              a new event picks this template.
            </p>
          </div>
          <Button onClick={addTemplate} disabled={creating} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> {creating ? "Creating…" : "New template"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="pl-9"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates match your search.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(t => (
              <Link
                key={t.id}
                to={`/admin/templates/${t.id}`}
                className={cn(
                  "group rounded-xl border bg-card p-5 transition-smooth hover:border-gold/50 hover:shadow-soft",
                  t.is_active ? "border-border" : "border-dashed border-border/50 opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl truncate">{t.label}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-gold">{t.slug}</span>
                      <span className="mx-1.5">·</span>
                      base: {t.base_renderer}
                    </p>
                  </div>
                  {!t.is_active && (
                    <Badge variant="outline" className="text-xs shrink-0">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2 min-h-[2.5rem]">
                  {t.description || <span className="italic opacity-70">No description yet.</span>}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTemplate(t); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <span className="inline-flex items-center text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
