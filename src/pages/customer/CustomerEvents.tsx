import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Users, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/invitation";

type Event = {
  id: string; slug: string; title: string; template: string;
  event_date: string | null; venue: string | null; cover_image_url: string | null;
};

export default function CustomerEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase
        .from("event_customers")
        .select("event_id")
        .eq("user_id", user.id);

      const ids = (links ?? []).map(l => l.event_id);
      if (ids.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("events")
        .select("id, slug, title, template, event_date, venue, cover_image_url")
        .in("id", ids)
        .order("event_date", { ascending: false });

      setEvents((data ?? []) as Event[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <CustomerLayout>
      <div className="space-y-8 animate-fade-up">
        <div>
          <h1 className="font-serif text-4xl">My events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. View RSVPs and manage your guest lists.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center rounded-xl border border-dashed border-border bg-card">
            <CalendarDays className="h-10 w-10 text-gold mx-auto mb-4 opacity-60" />
            <h3 className="font-serif text-2xl mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground">
              Your events will appear here once your provider sets them up.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {events.map(e => (
              <Link
                key={e.id}
                to={`/customer/events/${e.id}`}
                className="group rounded-xl overflow-hidden border border-border bg-gradient-surface shadow-soft hover:border-gold/40 hover:shadow-gold transition-smooth"
              >
                {e.cover_image_url && (
                  <div className="aspect-[16/7] overflow-hidden bg-muted">
                    <img
                      src={e.cover_image_url}
                      alt={e.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-serif text-2xl leading-tight">{e.title}</h3>
                    <ExternalLink className="h-4 w-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{formatDateTime(e.event_date)}</div>
                    {e.venue && <div className="break-words [overflow-wrap:anywhere]">{e.venue}</div>}
                    <div className="text-gold/70 capitalize">{e.template.replace("-", " ")}</div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase">
                    <Users className="h-3 w-3" /> Manage guests
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
