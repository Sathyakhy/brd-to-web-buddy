import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ExternalLink, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { slugify, formatDateTime } from "@/lib/invitation";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates } from "@/hooks/useTemplates";
import { formatMoney, paymentStatusClasses, paymentStatusLabel } from "@/lib/money";
import ListToolbar from "@/components/admin/ListToolbar";

type Event = {
  id: string; slug: string; title: string; internal_title: string | null; template: string;
  event_date: string | null; venue: string | null; description: string | null;
  cover_message: string | null; created_at: string;
  price_total: number; paid_amount: number; price_currency: string; payment_status: string;
};

export default function Events() {
  const { user } = useAuth();
  const { templates: TEMPLATES } = useTemplates();
  const [events, setEvents] = useState<Event[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search / filter / sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("essentials-package-01");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data, error }, ecRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("event_customers").select("event_id, user_id"),
    ]);
    if (error) toast.error(error.message);
    setEvents((data ?? []) as Event[]);

    const ecs = (ecRes.data ?? []) as { event_id: string; user_id: string }[];
    const userIds = Array.from(new Set(ecs.map(c => c.user_id)));
    const profilesRes = userIds.length
      ? await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds)
      : { data: [] as any[] };
    const byUser: Record<string, string> = Object.fromEntries(
      (profilesRes.data ?? []).map((p: any) => [p.user_id, p.display_name || p.email || "—"])
    );
    const map: Record<string, string> = {};
    for (const c of ecs) {
      const name = byUser[c.user_id];
      if (!name) continue;
      map[c.event_id] = map[c.event_id] ? `${map[c.event_id]}, ${name}` : name;
    }
    setCustomerMap(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setTitle(""); setSlug(""); setTemplate("essentials-package-01");
    setEventDate(""); setVenue(""); setCoverMessage(""); setDescription("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const finalSlug = slug || slugify(title);
    const { error } = await supabase.from("events").insert({
      title, slug: finalSlug, template,
      event_date: eventDate ? new Date(eventDate + "T00:00:00").toISOString() : null,
      venue: venue || null,
      cover_message: coverMessage || null,
      description: description || null,
      groom_name: "លោក|សោម|សុឃី\nលោកស្រី|តាំង|លីហួរ\nឃី|ច័ន្ទសត្យា",
      bride_name: "លោក|ជិន|ប៊ុនស្រ៊ាង\nលោកស្រី|ម៉ឿង|ស៊ីណាត\nស្រ៊ាងវាសនា|សុខនិកា",
      owner_id: user?.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Slug already in use" : error.message);
      return;
    }
    toast.success("Event created");
    setOpen(false);
    reset();
    load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its guests? This cannot be undone.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    load();
  };

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = events.filter(e => {
      if (statusFilter !== "all" && (e.payment_status || "unpaid") !== statusFilter) return false;
      if (templateFilter !== "all" && e.template !== templateFilter) return false;
      if (!q) return true;
      const hay = [
        e.title, e.internal_title ?? "", e.slug, e.venue ?? "", e.description ?? "", e.cover_message ?? "",
        customerMap[e.id] ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
    const cmp: Record<string, (a: Event, b: Event) => number> = {
      created_desc: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      created_asc: (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      date_asc: (a, b) => (a.event_date ? +new Date(a.event_date) : Infinity) - (b.event_date ? +new Date(b.event_date) : Infinity),
      date_desc: (a, b) => (b.event_date ? +new Date(b.event_date) : -Infinity) - (a.event_date ? +new Date(a.event_date) : -Infinity),
      title_asc: (a, b) => a.title.localeCompare(b.title),
      title_desc: (a, b) => b.title.localeCompare(a.title),
      price_desc: (a, b) => Number(b.price_total) - Number(a.price_total),
      price_asc: (a, b) => Number(a.price_total) - Number(b.price_total),
    };
    return arr.sort(cmp[sortBy] ?? cmp.created_desc);
  }, [events, customerMap, search, statusFilter, templateFilter, sortBy]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage your invitation events</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                <Plus className="h-4 w-4 mr-2" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Create event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={title} onChange={e => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="Sathya & Nika Wedding" />
                </div>
                <div className="space-y-2">
                  <Label>URL slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/</span>
                    <Input required value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="sathya-nika" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={template} onValueChange={setTemplate}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map(t => <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event date</Label>
                    <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Phnom Penh, Cambodia" />
                </div>
                <div className="space-y-2">
                  <Label>Cover message</Label>
                  <Input value={coverMessage} onChange={e => setCoverMessage(e.target.value)} placeholder="With great joy, we invite you…" />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                    {saving ? "Creating…" : "Create event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center rounded-xl border border-dashed border-border bg-card">
            <CalendarDays className="h-10 w-10 text-gold mx-auto mb-4 opacity-60" />
            <h3 className="font-serif text-2xl mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first event to start sending invitations.</p>
            <Button onClick={() => setOpen(true)} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Create event
            </Button>
          </div>
        ) : (
          <>
            <ListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search title, slug, venue, customer…"
              filter={{
                value: statusFilter, onChange: setStatusFilter,
                label: "Payment",
                options: [
                  { value: "all", label: "All payments" },
                  { value: "paid", label: "Paid" },
                  { value: "partial", label: "Partial" },
                  { value: "unpaid", label: "Unpaid" },
                ],
              }}
              filter2={{
                value: templateFilter, onChange: setTemplateFilter,
                label: "Template",
                options: [
                  { value: "all", label: "All templates" },
                  ...TEMPLATES.map(t => ({ value: t.slug, label: t.label })),
                ],
              }}
              sort={{
                value: sortBy, onChange: setSortBy,
                options: [
                  { value: "created_desc", label: "Newest first" },
                  { value: "created_asc", label: "Oldest first" },
                  { value: "date_asc", label: "Event date ↑" },
                  { value: "date_desc", label: "Event date ↓" },
                  { value: "title_asc", label: "Title A→Z" },
                  { value: "title_desc", label: "Title Z→A" },
                  { value: "price_desc", label: "Price ↓" },
                  { value: "price_asc", label: "Price ↑" },
                ],
              }}
              resultCount={filteredEvents.length}
              totalCount={events.length}
              resultLabel="events"
            />
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-card">
                No events match your filters.
              </div>
            ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map(e => (
              <div key={e.id} className="group rounded-xl border border-border bg-gradient-surface p-5 shadow-soft hover:border-gold/30 transition-smooth">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    {e.internal_title ? (
                      <>
                        <h3 className="font-serif text-xl leading-tight truncate">{e.internal_title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Invitation: {e.title}</p>
                      </>
                    ) : (
                      <h3 className="font-serif text-xl leading-tight truncate">{e.title}</h3>
                    )}
                  </div>
                  <button onClick={() => handleDelete(e.id, e.internal_title || e.title)} className="text-muted-foreground hover:text-destructive transition-smooth shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div>/<span className="text-gold">{e.slug}</span></div>
                  <div>{formatDateTime(e.event_date)}</div>
                  {e.venue && <div className="break-words [overflow-wrap:anywhere]">{e.venue}</div>}
                  <div className="truncate">
                    <span className="text-muted-foreground/70">Customer:</span>{" "}
                    <span className="text-foreground/80">{customerMap[e.id] || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3 pt-3 border-t border-border/60">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</div>
                    <div className="font-serif text-lg text-gradient-gold tabular-nums">
                      {formatMoney(e.price_total, e.price_currency)}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${paymentStatusClasses(e.payment_status)}`}>
                    {paymentStatusLabel(e.payment_status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/admin/events/${e.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">Manage</Button>
                  </Link>
                  <a href={`/${e.slug}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="text-gold">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
