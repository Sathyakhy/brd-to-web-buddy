import { supabase } from "@/integrations/supabase/client";
import { logTelegramDiagnostic } from "@/lib/telegramLogger";

export type CachedChatEvent = {
  eventId: string;
  eventTitle: string;
  slug?: string;
  eventDate?: string | null;
  guests?: any[];
  updatedAt: number;
};

const CHAT_MAP_STORAGE_KEY = "telegram_chat_to_event_cached_map";
const inMemoryChatMap = new Map<string, CachedChatEvent>();
let lastWarmedAt = 0;
const WARM_TTL_MS = 60000; // 1 minute background cache freshness

export function normalizeTelegramChatId(id: string | number | null | undefined): string {
  if (!id) return "";
  return String(id).trim().replace(/^-100/, "-");
}

export function areChatIdsEquivalent(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  if (normalizeTelegramChatId(strA) === normalizeTelegramChatId(strB)) return true;
  const numA = strA.replace(/^-/, "").replace(/^100/, "");
  const numB = strB.replace(/^-/, "").replace(/^100/, "");
  return numA.length > 4 && numA === numB;
}

/**
 * Initialize / hydrate the in-memory map from persistent storage
 */
export function hydrateChatToEventMap(): void {
  try {
    const raw = localStorage.getItem(CHAT_MAP_STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, CachedChatEvent> = JSON.parse(raw);
      for (const [chatId, data] of Object.entries(parsed)) {
        inMemoryChatMap.set(chatId, data);
      }
    }
  } catch (_) {}
}

/**
 * Directly register or update a single chat_id -> event mapping
 */
export function registerChatToEventMapping(
  chatId: string,
  eventData: {
    eventId: string;
    eventTitle: string;
    slug?: string;
    eventDate?: string | null;
    guests?: any[];
  }
): void {
  if (!chatId || !eventData.eventId) return;
  const cleanChatId = String(chatId).trim();
  const existing = getCachedEventByChatId(cleanChatId);

  const merged: CachedChatEvent = {
    eventId: eventData.eventId,
    eventTitle: eventData.eventTitle,
    slug: eventData.slug || existing?.slug,
    eventDate: eventData.eventDate !== undefined ? eventData.eventDate : existing?.eventDate,
    guests: (eventData.guests && eventData.guests.length > 0) ? eventData.guests : (existing?.guests || []),
    updatedAt: Date.now(),
  };

  inMemoryChatMap.set(cleanChatId, merged);

  try {
    const raw = localStorage.getItem(CHAT_MAP_STORAGE_KEY) || "{}";
    const map = JSON.parse(raw);
    map[cleanChatId] = merged;
    localStorage.setItem(CHAT_MAP_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

/**
 * Fast O(1) cached lookup of an event by Telegram Chat ID
 */
export function getCachedEventByChatId(chatId: string): CachedChatEvent | null {
  if (!chatId) return null;
  const cleanId = String(chatId).trim();

  // 1. Direct key match in memory
  if (inMemoryChatMap.has(cleanId)) {
    return inMemoryChatMap.get(cleanId)!;
  }

  // 2. Prefix-tolerant search across in-memory entries
  for (const [key, val] of inMemoryChatMap.entries()) {
    if (areChatIdsEquivalent(key, cleanId)) {
      inMemoryChatMap.set(cleanId, val); // cache alias
      return val;
    }
  }

  // 3. Fallback to localStorage
  try {
    const raw = localStorage.getItem(CHAT_MAP_STORAGE_KEY);
    if (raw) {
      const map: Record<string, CachedChatEvent> = JSON.parse(raw);
      for (const [key, val] of Object.entries(map)) {
        if (areChatIdsEquivalent(key, cleanId)) {
          inMemoryChatMap.set(cleanId, val);
          return val;
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Pre-warms the cached chat-to-event map by querying all active events with Telegram chat IDs
 */
export async function warmupChatToEventMap(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastWarmedAt < WARM_TTL_MS && inMemoryChatMap.size > 0) {
    return;
  }

  hydrateChatToEventMap();

  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, slug, event_date, section_visibility")
      .order("created_at", { ascending: false });

    if (!error && events) {
      for (const ev of events) {
        const vis = (ev.section_visibility as any) || {};
        const cId = vis.telegram_chat_id || (ev as any).telegram_chat_id;
        if (cId) {
          registerChatToEventMapping(String(cId), {
            eventId: ev.id,
            eventTitle: ev.title,
            slug: ev.slug,
            eventDate: ev.event_date,
          });
        }
      }
      lastWarmedAt = Date.now();
      console.info(`[TelegramChatMap] 🚀 Cached map warmed up with ${inMemoryChatMap.size} chat-to-event links.`);
    }
  } catch (err) {
    console.debug("[TelegramChatMap] Map warm-up notice:", err);
  }
}

// Automatically hydrate on module load
hydrateChatToEventMap();
