import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search } from "lucide-react";
import { formatDateTime } from "@/lib/invitation";

type AuditRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  event_id: string | null;
  details: Record<string, any>;
  created_at: string;
};

const ACTIONS = [
  "all",
  "auth.login",
  "auth.logout",
  "guest.created",
  "guest.updated",
  "guest.deleted",
  "guest.rsvp_changed",
  "guest.token_regenerated",
];

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [events, setEvents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const list = (data ?? []) as AuditRow[];
    setRows(list);

    // Fetch event titles for any referenced events
    const ids = Array.from(new Set(list.map(r => r.event_id).filter(Boolean))) as string[];
    if (ids.length > 0) {
      const { data: evs } = await supabase.from("events").select("id, title").in("id", ids);
      const map: Record<string, string> = {};
      (evs ?? []).forEach((e: any) => { map[e.id] = e.title; });
      setEvents(map);
    } else {
      setEvents({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (action !== "all" && r.action !== action) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        const hay = [
          r.user_email ?? "",
          r.action,
          JSON.stringify(r.details ?? {}),
          r.event_id ? events[r.event_id] ?? "" : "",
        ].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, action, q, events]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">Audit log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customer activity across the system — sign-ins, sign-outs, and guest changes.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, event…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map(a => (
                <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No matching activity yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left p-4 font-medium">When</th>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Action</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Event</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-smooth">
                      <td className="p-4 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="p-4">{r.user_email ?? "—"}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-xs">{r.action}</Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {r.event_id ? (events[r.event_id] ?? r.event_id.slice(0, 8)) : "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground max-w-md">
                        <code className="font-mono break-all">
                          {Object.keys(r.details ?? {}).length === 0 ? "—" : JSON.stringify(r.details)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
