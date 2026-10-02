import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Search, Bot, Activity, Trash2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/invitation";
import {
  getTelegramDiagnosticLogs,
  clearTelegramDiagnosticLogs,
  type TelegramDiagnosticLog,
} from "@/lib/telegramLogger";

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
  const [activeTab, setActiveTab] = useState<"activity" | "telegram">("telegram");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [events, setEvents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");

  // Telegram Diagnostic Logs state
  const [telegramLogs, setTelegramLogs] = useState<TelegramDiagnosticLog[]>([]);
  const [telegramSearch, setTelegramSearch] = useState("");
  const [telegramStatusFilter, setTelegramStatusFilter] = useState("all");

  const loadActivity = async () => {
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

  const loadTelegramLogs = () => {
    const logs = getTelegramDiagnosticLogs();
    setTelegramLogs(logs);
  };

  const handleRefreshAll = () => {
    loadActivity();
    loadTelegramLogs();
  };

  const handleClearTelegramLogs = () => {
    clearTelegramDiagnosticLogs();
    setTelegramLogs([]);
  };

  useEffect(() => {
    loadActivity();
    loadTelegramLogs();
  }, []);

  const filteredActivity = useMemo(() => {
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

  const filteredTelegramLogs = useMemo(() => {
    return telegramLogs.filter(log => {
      if (telegramStatusFilter !== "all" && log.status !== telegramStatusFilter) {
        return false;
      }
      if (telegramSearch.trim()) {
        const needle = telegramSearch.toLowerCase();
        const hay = [
          log.chatId,
          log.command,
          log.lookupStrategy,
          log.filterUsed,
          log.matchedEventTitle ?? "",
          log.matchedEventId ?? "",
          JSON.stringify(log.details ?? {}),
        ].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [telegramLogs, telegramStatusFilter, telegramSearch]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">System & Bot Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live diagnostic logs for user activity, Telegram bot incoming webhooks, and event lookup resolutions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Logs
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full sm:w-[460px] grid-cols-2">
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#229ED9]" />
              <span>Telegram Bot Diagnostics</span>
              {telegramLogs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#229ED9]/20 text-[#229ED9]">
                  {telegramLogs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Customer Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TELEGRAM BOT DIAGNOSTIC LOGS */}
          <TabsContent value="telegram" className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Chat ID, Command (/summary, /rsvp), Event Title, or Query Filter…"
                    value={telegramSearch}
                    onChange={e => setTelegramSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
                <Select value={telegramStatusFilter} onValueChange={setTelegramStatusFilter}>
                  <SelectTrigger className="w-[180px] text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success (Matched Event)</SelectItem>
                    <SelectItem value="no_event_linked">No Event Linked</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {telegramLogs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearTelegramLogs} className="text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear Logs
                </Button>
              )}
            </div>

            <section className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
              {filteredTelegramLogs.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                  <Bot className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="font-medium text-foreground">No Telegram webhook requests recorded yet.</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    When anyone types a command like <code>/summary</code>, <code>/rsvp</code>, or <code>/help</code> in your Telegram groups, the incoming request, chat_id, lookup strategy, and database query filters will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
                        <th className="text-left p-3.5 font-semibold">Timestamp</th>
                        <th className="text-left p-3.5 font-semibold">Chat ID</th>
                        <th className="text-left p-3.5 font-semibold">Command</th>
                        <th className="text-left p-3.5 font-semibold">Lookup Strategy & Query Filter</th>
                        <th className="text-left p-3.5 font-semibold">Matched Event</th>
                        <th className="text-left p-3.5 font-semibold">Result Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTelegramLogs.map(log => (
                        <tr key={log.id} className="hover:bg-secondary/30 transition-smooth">
                          <td className="p-3.5 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-foreground">
                            {log.chatId}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px] font-semibold text-[#229ED9]">
                              {log.command}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-sm">
                            <div className="space-y-0.5">
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground border border-border">
                                {log.lookupStrategy.replace(/_/g, " ")}
                              </span>
                              <p className="font-mono text-[10px] text-muted-foreground break-all">
                                {log.filterUsed}
                              </p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            {log.matchedEventTitle ? (
                              <div>
                                <span className="font-semibold text-foreground text-xs">{log.matchedEventTitle}</span>
                                <p className="text-[10px] text-muted-foreground">
                                  {log.guestCount !== undefined ? `${log.guestCount} guests loaded` : ""}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {log.status === "success" ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] flex items-center gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3" />
                                Matched Event
                              </Badge>
                            ) : log.status === "no_event_linked" ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                No Event Linked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Error
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </TabsContent>

          {/* TAB 2: CUSTOMER ACTIVITY LOGS */}
          <TabsContent value="activity" className="space-y-4 pt-4">
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
              ) : filteredActivity.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No matching customer activity yet.
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
                      {filteredActivity.map(r => (
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
