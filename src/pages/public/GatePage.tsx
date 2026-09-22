import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/invitation";
import { Sparkles } from "lucide-react";

type Event = {
  id: string; slug: string; title: string;
  event_date: string | null; venue: string | null; cover_message: string | null;
};

export default function GatePage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.rpc("get_event_public_by_slug", {
        _slug: slug,
      });
      const row = Array.isArray(data) ? data[0] : data;
      setEvent((row as Event | null) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-4xl text-gradient-gold mb-3">Event not found</h1>
          <p className="text-muted-foreground mb-6">This invitation link is invalid or has been removed.</p>
          <Link to="/" className="text-gold hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-surface min-h-screen bg-gradient-hero text-foreground flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-widest uppercase mb-8">
          <Sparkles className="h-3 w-3" /> You are invited
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 text-gradient-gold break-words">
          {event.title}
        </h1>

        <div className="gold-divider my-8" />

        {event.cover_message && (
          <p className="font-serif text-xl italic text-foreground/80 mb-8">"{event.cover_message}"</p>
        )}

        <div className="space-y-2 text-sm text-muted-foreground tracking-wider uppercase">
          {event.event_date && <div>{formatDate(event.event_date)}</div>}
          {event.venue && <div className="text-gold/80">{event.venue}</div>}
        </div>

        <div className="gold-divider my-8" />

        <p className="text-sm text-muted-foreground">
          To view your personalized invitation, please open the unique link sent to you.
        </p>
      </div>
    </div>
  );
}
