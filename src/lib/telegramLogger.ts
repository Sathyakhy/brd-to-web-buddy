export type TelegramDiagnosticLog = {
  id: string;
  timestamp: string;
  updateId?: number;
  chatId: string;
  command: string;
  lookupStrategy: "in_memory_cache" | "supabase_rpc" | "events_table_scan" | "callback_params" | "none";
  filterUsed: string;
  matchedEventId?: string | null;
  matchedEventTitle?: string | null;
  guestCount?: number;
  status: "success" | "no_event_linked" | "error" | "skipped";
  details?: Record<string, any>;
};

const STORAGE_KEY = "telegram_diagnostic_logs";
const MAX_LOGS = 200;

export function logTelegramDiagnostic(log: Omit<TelegramDiagnosticLog, "id" | "timestamp">) {
  try {
    const entry: TelegramDiagnosticLog = {
      ...log,
      id: "tlog-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    const logs: TelegramDiagnosticLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);

    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn("Failed to persist Telegram diagnostic log:", err);
  }
}

export function getTelegramDiagnosticLogs(): TelegramDiagnosticLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function clearTelegramDiagnosticLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}
