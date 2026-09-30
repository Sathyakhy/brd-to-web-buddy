import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Copy, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { generateToken, formatDateTime } from "@/lib/invitation";
import { RsvpBadge } from "@/components/admin/RsvpBadge";
import PreviewPanel from "@/components/admin/PreviewPanel";
import type { TemplateData } from "@/components/templates/InvitationTemplate";

type Event = TemplateData & {
  id: string; slug: string; title: string; template: string;
};

type Guest = {
  id: string; name: string; token: string; rsvp_status: string;
  party_size: number; message: string | null; responded_at: string | null;
};

export default function CustomerEventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState("");
  const [addGuestLanguage, setAddGuestLanguage] = useState<"km" | "en">("km");
  const [authorized, setAuthorized] = useState(false);

  const getGuestLang = (g: Guest): "km" | "en" => {
    if (g.token?.endsWith("-en")) return "en";
    return "km";
  };

  const setGuestLang = async (g: Guest, newLang: "km" | "en") => {
    const baseToken = g.token.replace(/-(en|km|kh)$/i, "");
    const newToken = `${baseToken}-${newLang}`;
    const { error } = await supabase.from("guests").update({ token: newToken }).eq("id", g.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, token: newToken } : x));
    toast.success(`Language set to ${newLang === "en" ? "English (EN)" : "Khmer (KH)"} for ${g.name}`);
  };

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);

    const { data: link } = await supabase
      .from("event_customers")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!link) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);

    const [evRes, gRes] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("guests").select("*").eq("event_id", id).order("created_at", { ascending: false }),
    ]);
    setEvent(evRes.data as Event | null);
    setGuests((gRes.data ?? []) as Guest[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user]);

  const handleAddGuests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    const rows = names.map(name => ({ event_id: event.id, name, token: `${generateToken(12)}-${addGuestLanguage}` }));
    const { error } = await supabase.from("guests").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${names.length} guest${names.length > 1 ? "s" : ""}`);
    setBulkNames("");
    setAddOpen(false);
    load();
  };

  const copyLink = (token: string, lang?: "km" | "en") => {
    if (!event) return "";
    const l = lang ?? (token.endsWith("-en") ? "en" : "km");
    const url = `https://share.21invite.online/${encodeURIComponent(event.slug)}/invite?token=${encodeURIComponent(token)}&lang=${l}`;
    navigator.clipboard.writeText(url);
    toast.success("Invitation link copied");
  };

  const regenerate = async (g: Guest) => {
    const newToken = generateToken(12);
    const { error } = await supabase.from("guests").update({ token: newToken }).eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success("Token regenerated");
    load();
  };

  const removeGuest = async (g: Guest) => {
    if (!confirm(`Remove ${g.name}?`)) return;
    const { error } = await supabase.from("guests").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success("Guest removed");
    load();
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center text-sm text-muted-foreground py-12">Loading…</div>
      </CustomerLayout>
    );
  }

  if (!authorized || !event) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Event not found or access denied.</p>
          <Link to="/customer"><Button variant="outline">Back to my events</Button></Link>
        </div>
      </CustomerLayout>
    );
  }

  const stats = {
    total: guests.length,
    yes: guests.filter(g => g.rsvp_status === "yes").length,
    no: guests.filter(g => g.rsvp_status === "no").length,
    pending: guests.filter(g => g.rsvp_status === "pending").length,
    headcount: guests.filter(g => g.rsvp_status === "yes").reduce((sum, g) => sum + g.party_size, 0),
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 animate-fade-up">
        <div>
          <Link to="/customer" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold transition-smooth mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> My events
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl">{event.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDateTime(event.event_date)} {event.venue ? `· ${event.venue}` : ""}
              </p>
            </div>
            <a href={`/${event.slug}`} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" /> View invitation
              </Button>
            </a>
          </div>
        </div>

        {/* Preview ⇄ Manage tabs — sticky freeze pane so hosts can
            switch tabs instantly without scrolling all the way back to the top */}
        <Tabs defaultValue="preview" className="w-full">
          {/* Sticky Freeze Pane Bar */}
          <div className="sticky top-14 lg:top-0 z-30 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 py-2.5 mb-6 border-b border-border/80 shadow-xs transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="font-serif text-sm font-semibold text-foreground truncate max-w-[200px] lg:max-w-xs">
                  {event.title}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  (/{event.slug})
                </span>
              </div>
              <TabsList className="grid w-full sm:w-auto grid-cols-2 font-serif h-9">
                <TabsTrigger value="preview" className="text-xs sm:text-sm px-4 py-1.5">Preview</TabsTrigger>
                <TabsTrigger value="manage" className="text-xs sm:text-sm px-4 py-1.5">
                  Manage guests {guests.length > 0 && <span className="ml-1 text-[11px] opacity-70">({guests.length})</span>}
                </TabsTrigger>
              </TabsList>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <a href={`/${event.slug}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden lg:inline">View invitation</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <TabsContent value="preview" className="mt-0">
            <PreviewPanel event={event as any} publicHref={`/${event.slug}`} bare />
          </TabsContent>

          <TabsContent value="manage" className="mt-6 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Invited", value: stats.total },
            { label: "Attending", value: stats.yes },
            { label: "Declined", value: stats.no },
            { label: "Pending", value: stats.pending },
            { label: "Headcount", value: stats.headcount },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="font-serif text-3xl text-gradient-gold mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-border bg-card shadow-soft">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl">Guests</h2>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add guests
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Add guests</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddGuests} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Names (one per line)</Label>
                    <Textarea rows={6} value={bulkNames} onChange={e => setBulkNames(e.target.value)}
                      placeholder="One name per line" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Default Language</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAddGuestLanguage("km")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                          addGuestLanguage === "km"
                            ? "border-gold bg-gold/15 text-gold font-semibold shadow-2xs"
                            : "border-input hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">KH</span>
                        <span>ភាសាខ្មែរ (Khmer)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddGuestLanguage("en")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                          addGuestLanguage === "en"
                            ? "border-gold bg-gold/15 text-gold font-semibold shadow-2xs"
                            : "border-input hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">EN</span>
                        <span>English</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Each guest gets a unique secure invitation link.</p>
                  <DialogFooter>
                    <Button type="submit" className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                      Create guests
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {guests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No guests yet. Add your guest list to start sharing invitations.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Language</th>
                    <th className="text-left p-4 font-medium">RSVP</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Party</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Wishes</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guests.map(g => {
                    const gLang = getGuestLang(g);
                    return (
                      <tr key={g.id} className="hover:bg-secondary/30 transition-smooth">
                        <td className="p-4">
                          <div className="font-medium">{g.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {g.responded_at ? `Responded ${formatDateTime(g.responded_at)}` : "Not yet responded"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setGuestLang(g, "km")}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                gLang === "km"
                                  ? "bg-gold text-primary-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              title="Set default language to Khmer"
                            >
                              KH
                            </button>
                            <button
                              type="button"
                              onClick={() => setGuestLang(g, "en")}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                gLang === "en"
                                  ? "bg-gold text-primary-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              title="Set default language to English"
                            >
                              EN
                            </button>
                          </div>
                        </td>
                        <td className="p-4"><RsvpBadge status={g.rsvp_status} /></td>
                        <td className="p-4 hidden md:table-cell">{g.party_size}</td>
                        <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground italic max-w-xs">
                          {g.message ? `"${g.message}"` : "—"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => copyLink(g.token, gLang)} title="Copy invitation link">
                              <Copy className="h-4 w-4 text-gold" />
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
          )}
        </section>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
}
