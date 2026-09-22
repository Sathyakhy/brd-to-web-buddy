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
  const [authorized, setAuthorized] = useState(false);

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
    const rows = names.map(name => ({ event_id: event.id, name, token: generateToken(12) }));
    const { error } = await supabase.from("guests").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${names.length} guest${names.length > 1 ? "s" : ""}`);
    setBulkNames("");
    setAddOpen(false);
    load();
  };

  const copyLink = (token: string) => {
    if (!event) return;
    const url = `${window.location.origin}/${event.slug}/invite?token=${token}`;
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

        {/* Preview ⇄ Manage tabs — visually separates the live invitation
            preview from the guest-management UI. */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="manage">Manage guests</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
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
                    <Textarea rows={8} value={bulkNames} onChange={e => setBulkNames(e.target.value)}
                      placeholder="One name per line" required />
                    <p className="text-xs text-muted-foreground">Each guest gets a unique secure invitation link.</p>
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
                    <th className="text-left p-4 font-medium">RSVP</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Party</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Wishes</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guests.map(g => (
                    <tr key={g.id} className="hover:bg-secondary/30 transition-smooth">
                      <td className="p-4">
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {g.responded_at ? `Responded ${formatDateTime(g.responded_at)}` : "Not yet responded"}
                        </div>
                      </td>
                      <td className="p-4"><RsvpBadge status={g.rsvp_status} /></td>
                      <td className="p-4 hidden md:table-cell">{g.party_size}</td>
                      <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground italic max-w-xs">
                        {g.message ? `"${g.message}"` : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyLink(g.token)} title="Copy invitation link">
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
                  ))}
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
