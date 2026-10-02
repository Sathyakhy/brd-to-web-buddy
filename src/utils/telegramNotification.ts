import { supabase } from "@/integrations/supabase/client";
import { logTelegramDiagnostic } from "@/lib/telegramLogger";

export const DEFAULT_TELEGRAM_BOT_TOKEN = "8688668764:AAEgS0I4SHxevvGIYvKXAjajCG3TIioCwZc";
export const DEFAULT_TELEGRAM_BOT_USERNAME = "EInvitation_Bot";

/**
 * Escapes characters that are special in Telegram's HTML parse mode:
 * &, <, >, "
 */
export function escapeTelegramHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TelegramRsvpNotificationParams = {
  chatId: string;
  botToken?: string | null;
  eventTitle: string;
  guestName: string;
  status: "yes" | "no";
  partySize: number;
  message?: string | null;
  isEdit?: boolean;
  language?: "km" | "en";
  eventSlug?: string;
};

/**
 * Sends an instant notification when a guest submits an RSVP.
 */
export async function sendTelegramRsvpNotification(params: TelegramRsvpNotificationParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const {
    chatId,
    botToken = DEFAULT_TELEGRAM_BOT_TOKEN,
    eventTitle,
    guestName,
    status,
    partySize,
    message,
    isEdit = false,
  } = params;

  const token = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = (chatId || "").trim();

  if (!targetChatId) {
    return { success: false, error: "Missing Telegram Chat ID" };
  }

  const isAttending = status === "yes";
  const statusEmoji = isAttending
    ? "✅ យល់ព្រមចូលរួម (Joyfully Attending)"
    : "❌ សុំទោស មិនអាចចូលរួម (Regretfully Declined)";

  const headerTitle = isEdit
    ? "✏️ <b>កែប្រែការឆ្លើយតប RSVP / RSVP Response Updated</b>"
    : "💌 <b>ការឆ្លើយតប RSVP ថ្មី / New RSVP Response</b>";

  const safeEvent = escapeTelegramHtml(eventTitle || "Wedding Celebration");
  const safeGuest = escapeTelegramHtml(guestName || "Honored Guest");
  const safeMsg = escapeTelegramHtml(message?.trim() || "");

  const phnomPenhTime = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const lines = [
    headerTitle,
    "━━━━━━━━━━━━━━━━━━",
    `💍 <b>កម្មវិធី (Event):</b> ${safeEvent}`,
    `👤 <b>ភ្ញៀវ (Guest):</b> <b>${safeGuest}</b>`,
    `📌 <b>ស្ថានភាព (Status):</b> ${statusEmoji}`,
    ...(isAttending ? [`👥 <b>ចំនួនភ្ញៀវ (Party Size):</b> <b>${partySize}</b> នាក់ / Guests`] : []),
    ...(safeMsg ? ["", `💬 <b>ពាក្យជូនពរ (Wishes):</b>`, `<i>"${safeMsg}"</i>`] : []),
    "━━━━━━━━━━━━━━━━━━",
    `⏰ <i>${phnomPenhTime} (Phnom Penh)</i>`,
  ];

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn("Telegram API error:", data.description);
      return { success: false, error: data.description || "Failed to send message" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to post RSVP to Telegram:", err);
    return { success: false, error: err?.message || "Network error" };
  }
}

/**
 * Sends a test notification to verify the Bot Token and Chat ID connection.
 */
export async function sendTelegramTestNotification(
  chatId: string,
  eventTitle: string,
  botToken?: string | null
): Promise<{ success: boolean; error?: string }> {
  const token = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = (chatId || "").trim();

  if (!targetChatId) {
    return { success: false, error: "Please enter a Telegram Chat ID first" };
  }

  const safeEvent = escapeTelegramHtml(eventTitle || "Wedding Celebration");
  const phnomPenhTime = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const lines = [
    "🔔 <b>ការតេស្តការជូនដំណឹង / Telegram Notification Test</b>",
    "━━━━━━━━━━━━━━━━━━",
    `🎉 <b>ការតភ្ជាប់ជោគជ័យ! / Connection Successful!</b>`,
    `💍 <b>កម្មវិធី (Event):</b> ${safeEvent}`,
    `🤖 <b>Telegram Bot:</b> @${DEFAULT_TELEGRAM_BOT_USERNAME}`,
    `ℹ️ <i>រាល់ពេលដែលមានភ្ញៀវឆ្លើយតប RSVP ប្រព័ន្ធនឹងផ្ញើសារស្វ័យប្រវត្តិចូលមកកាន់ក្រុមនេះ។</i>`,
    `<i>(RSVP responses for this event will be pushed automatically to this group.)</i>`,
    "━━━━━━━━━━━━━━━━━━",
    `💡 <b>ពាក្យបញ្ជាក្នុងក្រុម / Group Commands:</b>`,
    `• <b>/rsvp</b> — របាយការណ៍សង្ខេប (Quick summary of headcount & RSVP counts)`,
    `• <b>/summary</b> — បញ្ជីឈ្មោះភ្ញៀវលម្អិត និងពាក្យជូនពរ (Detailed guest list, pax & wishes)`,
    `• <b>/help</b> — បង្ហាញការណែនាំ (Help menu)`,
    "━━━━━━━━━━━━━━━━━━",
    `⏰ <i>${phnomPenhTime} (Phnom Penh)</i>`,
  ];

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "Failed to send test message" };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error" };
  }
}

export type DetectedTelegramChat = {
  id: string;
  title: string;
  type: string;
  username?: string;
};

/**
 * Reads recent updates from the Bot to detect groups where the bot was added or received messages.
 */
export async function fetchRecentTelegramChats(botToken?: string | null): Promise<{
  chats: DetectedTelegramChat[];
  error?: string;
}> {
  const token = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      method: "GET",
    });
    const data = await res.json();
    if (!data.ok) {
      return { chats: [], error: data.description || "Failed to fetch updates" };
    }

    const map = new Map<string, DetectedTelegramChat>();

    for (const update of data.result || []) {
      const msg = update.message || update.my_chat_member || update.channel_post;
      if (!msg) continue;
      const chat = msg.chat;
      if (!chat || !chat.id) continue;

      const idStr = String(chat.id);
      const title = chat.title || chat.username || `${chat.first_name || ""} ${chat.last_name || ""}`.trim() || idStr;

      map.set(idStr, {
        id: idStr,
        title,
        type: chat.type || "unknown",
        username: chat.username,
      });
    }

    return { chats: Array.from(map.values()) };
  } catch (err: any) {
    return { chats: [], error: err?.message || "Failed to connect to Telegram" };
  }
}

/**
 * Extracts clean guest name and wishes from a guest record (handling broadcast [Name] prefixes).
 */
export function extractGuestNameAndWishes(g: any): { name: string; wishes: string } {
  let name = g.name || "Honored Guest";
  let wishes = (g.message || "").trim();

  if (g.token?.startsWith("broadcast-") && wishes.startsWith("[")) {
    const match = wishes.match(/^\[(.*?)\](?:\s*(.*))?$/s);
    if (match && match[1]?.trim()) {
      name = match[1].trim();
      wishes = (match[2] || "").trim();
    }
  }
  return { name, wishes };
}

/**
 * Helper to partition guests into visible, attending, declined, and pending.
 * Excludes unassigned broadcast placeholders and deduplicates any identical respondents.
 */
function partitionGuests(guests: any[]) {
  const rawList = guests.filter((g) => {
    // Exclude unassigned root broadcast template tokens if still in pending state without any response
    if (g.token === "broadcast-km" || g.token === "broadcast-en") {
      const isPlaceholder =
        (g.name === "Honored Guest" ||
         g.name === "ភ្ញៀវកិត្តិយស" ||
         g.name?.includes("Broadcast")) &&
        g.rsvp_status === "pending" &&
        !g.responded_at &&
        (!g.message || !g.message.trim());
      if (isPlaceholder) return false;
    }
    const isUnassigned =
      g.token?.startsWith("broadcast-") &&
      g.rsvp_status === "pending" &&
      !g.responded_at &&
      (!g.message || !g.message.trim());
    return !isUnassigned;
  });

  // Deduplicate by clean name and message content so duplicate rows aren't tallied twice
  const seenKeys = new Set<string>();
  const visible: any[] = [];

  for (const g of rawList) {
    const { name, wishes } = extractGuestNameAndWishes(g);
    const normName = name.trim().toLowerCase();
    const dedupeKey = wishes.trim()
      ? `${normName}::${wishes.trim().toLowerCase()}`
      : `${normName}::${g.token || g.id}`;

    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      visible.push(g);
    }
  }

  const attending = visible.filter((g) => g.rsvp_status === "yes");
  const declined = visible.filter((g) => g.rsvp_status === "no");
  const pending = visible.filter((g) => g.rsvp_status === "pending");
  const totalPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

  return { visible, attending, declined, pending, totalPax };
}

/**
 * 1. FORMAT QUICK SUMMARY (for /rsvp or /quick)
 * Concise overview: Headcount/Pax, Attending count, Declined count, Pending count.
 */
export function formatTelegramRsvpQuickSummary(params: {
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
}): string {
  const { eventTitle, eventDate, guests } = params;
  const { attending, declined, pending, totalPax } = partitionGuests(guests);

  const safeTitle = escapeTelegramHtml(eventTitle || "Wedding Celebration");
  const formattedDate = eventDate ? escapeTelegramHtml(new Date(eventDate).toLocaleDateString("en-GB")) : "";

  const phnomPenhTime = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const lines = [
    `📊 <b>របាយការណ៍សង្ខេបវត្តមាន / Quick RSVP Summary</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `💍 <b>កម្មវិធី (Event):</b> ${safeTitle}`,
    ...(formattedDate ? [`📅 <b>កាលបរិច្ឆេទ (Date):</b> ${formattedDate}`] : []),
    `👥 <b>ចំនួនភ្ញៀវចូលរួមសរុប (Total Attending):</b> <b>${totalPax}</b> នាក់ / Pax`,
    `━━━━━━━━━━━━━━━━━━`,
    `✅ <b>យល់ព្រមចូលរួម (Attending):</b> <b>${attending.length}</b> ក្រុម/នាក់`,
    `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${declined.length}</b> នាក់`,
    `⏳ <b>កំពុងរង់ចាំ (Pending):</b> <b>${pending.length}</b> នាក់`,
    `━━━━━━━━━━━━━━━━━━`,
    `💡 <i>វាយ <b>/summary</b> ដើម្បីមើលបញ្ជីឈ្មោះភ្ញៀវចូលរួម និងពាក្យជូនពរលម្អិត។</i>`,
    `<i>(Type /summary to view full guest names, pax & wishes.)</i>`,
    `⏰ <i>${phnomPenhTime} (Phnom Penh)</i>`,
  ];

  return lines.join("\n");
}

/**
 * 2. FORMAT DETAILED GUEST LIST & WISHES (for /summary or /detail)
 * Comprehensive breakdown: every attending guest's name, individual pax, and their personal wishes.
 */
export function formatTelegramRsvpDetailList(params: {
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
}): string[] {
  const { eventTitle, eventDate, guests } = params;
  const { attending, declined, pending, totalPax } = partitionGuests(guests);

  const safeTitle = escapeTelegramHtml(eventTitle || "Wedding Celebration");
  const formattedDate = eventDate ? escapeTelegramHtml(new Date(eventDate).toLocaleDateString("en-GB")) : "";

  const phnomPenhTime = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const header = [
    `📋 <b>បញ្ជីឈ្មោះភ្ញៀវ និងពាក្យជូនពរ / Detailed Guest List & Wishes</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `💍 <b>កម្មវិធី (Event):</b> ${safeTitle}`,
    ...(formattedDate ? [`📅 <b>កាលបរិច្ឆេទ (Date):</b> ${formattedDate}`] : []),
    `👥 <b>យល់ព្រមចូលរួម (Attending):</b> <b>${totalPax}</b> នាក់ (Pax) — ${attending.length} ក្រុម`,
    `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${declined.length}</b> នាក់`,
    `━━━━━━━━━━━━━━━━━━`,
    `<b>បញ្ជីភ្ញៀវយល់ព្រមចូលរួម (Attending Guests & Wishes):</b>`,
    ``,
  ];

  const bodyLines: string[] = [];

  if (attending.length === 0) {
    bodyLines.push(`<i>មិនទាន់មានភ្ញៀវយល់ព្រមចូលរួមនៅឡើយទេ។ / No confirmed attendees yet.</i>`);
  } else {
    attending.forEach((g, idx) => {
      const { name, wishes } = extractGuestNameAndWishes(g);
      const pax = Number(g.party_size) || 1;
      const safeGName = escapeTelegramHtml(name);
      const safeWishes = escapeTelegramHtml(wishes);

      let item = `${idx + 1}. <b>${safeGName}</b> — 👥 <b>${pax}</b> នាក់ (Pax)`;
      if (safeWishes) {
        item += `\n   💬 <i>"${safeWishes}"</i>`;
      }
      bodyLines.push(item);
    });
  }

  bodyLines.push(``);
  bodyLines.push(`━━━━━━━━━━━━━━━━━━`);
  bodyLines.push(`❌ <b>ភ្ញៀវសុំទោសមិនអាចចូលរួម / Declined & Regrets (${declined.length} នាក់):</b>`);
  if (declined.length === 0) {
    bodyLines.push(`<i>គ្មានភ្ញៀវបដិសេធទេ / None</i>`);
  } else {
    declined.forEach((g, idx) => {
      const { name, wishes } = extractGuestNameAndWishes(g);
      const safeGName = escapeTelegramHtml(name);
      const safeWishes = escapeTelegramHtml(wishes);
      let item = `${idx + 1}. <b>${safeGName}</b> — ❌ <i>មិនអាចចូលរួម (Declined)</i>`;
      if (safeWishes) {
        item += `\n   💬 <i>"${safeWishes}"</i>`;
      }
      bodyLines.push(item);
    });
  }

  bodyLines.push(``);
  bodyLines.push(`━━━━━━━━━━━━━━━━━━`);
  bodyLines.push(`⏰ <i>ធ្វើបច្ចុប្បន្នភាពនៅ ${phnomPenhTime} (Phnom Penh)</i>`);

  const fullText = [...header, ...bodyLines].join("\n");
  if (fullText.length <= 4000) {
    return [fullText];
  }

  // Chunking when message exceeds Telegram's limit
  const chunks: string[] = [];
  let currentChunk = header.join("\n") + "\n";

  for (const line of bodyLines) {
    if ((currentChunk + line + "\n").length > 3800) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += line + "\n";
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * 3. FORMAT HELP MESSAGE (for /help or /start)
 */
export function formatTelegramHelpMessage(eventTitle?: string | null, chatId?: string | null): string {
  const safeEvent = eventTitle ? escapeTelegramHtml(eventTitle) : null;
  return [
    `🤖 <b>21Invite.Online RSVP Bot (@${DEFAULT_TELEGRAM_BOT_USERNAME})</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `សួស្តី! ខ្ញុំជា Bot សម្រាប់ទទួលដំណឹង RSVP និងរបាយការណ៍វត្តមានភ្ញៀវ។`,
    `<i>(Hello! I am your automated wedding RSVP & guest management bot.)</i>`,
    ``,
    `📌 <b>ពាក្យបញ្ជាដែលមាន / Available Commands:</b>`,
    `• <b>/rsvp</b> — របាយការណ៍សង្ខេប (Quick summary of headcount & RSVP counts)`,
    `• <b>/summary</b> — បញ្ជីឈ្មោះភ្ញៀវលម្អិត និងពាក្យជូនពរ (Detailed guest list, pax & wishes)`,
    `• <b>/help</b> — បង្ហាញការណែនាំនេះ (Show this help message)`,
    `━━━━━━━━━━━━━━━━━━`,
    ...(safeEvent
      ? [`💍 <b>កម្មវិធីដែលបានភ្ជាប់ (Linked Event):</b> ${safeEvent}`]
      : chatId
      ? [`Group Chat ID: <code>${chatId}</code>`, `<i>(Please link this Chat ID in your event dashboard.)</i>`]
      : []),
  ].join("\n");
}

/**
 * Sends the Quick RSVP Summary (/rsvp) to the Telegram group.
 */
export async function sendTelegramRsvpQuickSummary(params: {
  chatId: string;
  botToken?: string | null;
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
}): Promise<{ success: boolean; error?: string }> {
  const { chatId, botToken, eventTitle, eventDate, guests } = params;
  const token = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = (chatId || "").trim();

  if (!targetChatId) {
    return { success: false, error: "Missing Telegram Chat ID" };
  }

  const text = formatTelegramRsvpQuickSummary({ eventTitle, eventDate, guests });

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "Failed to send quick summary" };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error" };
  }
}

/**
 * Sends the Detailed Guest List & Wishes (/summary) to the Telegram group.
 */
export async function sendTelegramRsvpDetailList(params: {
  chatId: string;
  botToken?: string | null;
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
}): Promise<{ success: boolean; error?: string }> {
  const { chatId, botToken, eventTitle, eventDate, guests } = params;
  const token = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = (chatId || "").trim();

  if (!targetChatId) {
    return { success: false, error: "Missing Telegram Chat ID" };
  }

  const chunks = formatTelegramRsvpDetailList({ eventTitle, eventDate, guests });

  try {
    for (const chunk of chunks) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: chunk,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        return { success: false, error: data.description || "Failed to send detailed list" };
      }
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error" };
  }
}

let lastHandledUpdateOffset = 0;
const processedUpdateIds = new Set<number>();
const DEDUP_STORAGE_KEY = "telegram_processed_update_ids";
const UNLINKED_NOTICE_COOLDOWN_MS = 60000; // 1 minute cooldown per unlinked chat to prevent spam

function isUpdateAlreadyHandledCrossTab(updateId: number): boolean {
  if (processedUpdateIds.has(updateId)) return true;
  processedUpdateIds.add(updateId);
  if (processedUpdateIds.size > 500) {
    const first = processedUpdateIds.values().next().value;
    if (first !== undefined) processedUpdateIds.delete(first);
  }

  try {
    const raw = localStorage.getItem(DEDUP_STORAGE_KEY);
    const list: number[] = raw ? JSON.parse(raw) : [];
    if (list.includes(updateId)) {
      return true;
    }
    list.push(updateId);
    if (list.length > 500) list.shift();
    localStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(list));
    return false;
  } catch (_) {
    return false;
  }
}

function shouldSendUnlinkedNotice(chatId: string): boolean {
  try {
    const raw = localStorage.getItem("telegram_unlinked_notices") || "{}";
    const record = JSON.parse(raw);
    const lastSent = record[chatId] || 0;
    const now = Date.now();
    if (now - lastSent < UNLINKED_NOTICE_COOLDOWN_MS) {
      return false;
    }
    record[chatId] = now;
    localStorage.setItem("telegram_unlinked_notices", JSON.stringify(record));
    return true;
  } catch (_) {
    return true;
  }
}

// Global in-memory registry of active events mapped to Telegram Chat IDs
const inMemoryChatToEventMap = new Map<string, {
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
  eventId?: string;
  slug?: string;
}>();

export function registerTelegramChatEvent(chatId: string, eventData: {
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
  eventId?: string;
  slug?: string;
}) {
  if (!chatId) return;
  const cleanId = String(chatId).trim();
  const existing = getCachedTelegramChatEvent(cleanId);
  const finalGuests = (eventData.guests && eventData.guests.length > 0)
    ? eventData.guests
    : (existing?.guests && existing.guests.length > 0 ? existing.guests : []);

  const merged = {
    ...eventData,
    guests: finalGuests,
  };

  inMemoryChatToEventMap.set(cleanId, merged);
  try {
    const raw = localStorage.getItem("telegram_chat_event_cache") || "{}";
    const cache = JSON.parse(raw);
    cache[cleanId] = {
      eventTitle: merged.eventTitle,
      eventDate: merged.eventDate,
      guests: merged.guests,
      eventId: merged.eventId,
      slug: merged.slug,
      updatedAt: Date.now(),
    };
    localStorage.setItem("telegram_chat_event_cache", JSON.stringify(cache));
  } catch (_) {}
}

export function normalizeChatId(id: string | number | null | undefined): string {
  if (!id) return "";
  return String(id).trim().replace(/^-100/, "-");
}

export function chatIdsMatch(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  if (normalizeChatId(strA) === normalizeChatId(strB)) return true;
  const numA = strA.replace(/^-/, "").replace(/^100/, "");
  const numB = strB.replace(/^-/, "").replace(/^100/, "");
  return numA.length > 4 && numA === numB;
}

export function getCachedTelegramChatEvent(chatId: string) {
  const cleanId = String(chatId).trim();
  for (const [key, val] of inMemoryChatToEventMap.entries()) {
    if (chatIdsMatch(key, cleanId)) {
      return val;
    }
  }
  try {
    const raw = localStorage.getItem("telegram_chat_event_cache");
    if (raw) {
      const cache = JSON.parse(raw);
      for (const [key, val] of Object.entries(cache)) {
        if (chatIdsMatch(key, cleanId)) {
          inMemoryChatToEventMap.set(cleanId, val as any);
          return val as any;
        }
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Checks for commands (/help, /rsvp, /summary) in Telegram updates and replies immediately.
 * Handles case-insensitivity (/Help, /Summary, /RSVP) and bot username suffixes.
 * Includes direct database fallback lookup for linked events.
 */
export async function processTelegramBotCommands(params?: {
  botToken?: string | null;
  getEventDataForChat?: (chatId: string) => Promise<{
    eventTitle: string;
    eventDate?: string | null;
    guests: any[];
  } | null>;
}): Promise<{ processedCount: number }> {
  const token = (params?.botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;

  try {
    const url = lastHandledUpdateOffset > 0
      ? `https://api.telegram.org/bot${token}/getUpdates?offset=${lastHandledUpdateOffset}&limit=20`
      : `https://api.telegram.org/bot${token}/getUpdates?limit=20`;

    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (!data.ok || !data.result || data.result.length === 0) {
      return { processedCount: 0 };
    }

    let processed = 0;
    const nowSec = Math.floor(Date.now() / 1000);

    for (const update of data.result) {
      lastHandledUpdateOffset = Math.max(lastHandledUpdateOffset, update.update_id + 1);

      if (isUpdateAlreadyHandledCrossTab(update.update_id)) continue;

      const msg = update.message || update.channel_post;
      if (!msg || !msg.chat || !msg.text) continue;

      // Allow commands up to 10 minutes old (prevents dropping commands sent right before tab opened)
      if (msg.date && (nowSec - msg.date) > 600) continue;

      const chatId = String(msg.chat.id);
      const rawText = msg.text.trim();
      // Normalize command: lowercased, first word, remove @botname (e.g. "/Summary@EInvitation_Bot" -> "/summary")
      const firstToken = rawText.toLowerCase().split(/\s+/)[0];
      const cmd = firstToken.replace(/@[\w_]+/g, "");

      // Helper to resolve event data via passed callback or direct Supabase lookup
      const resolveEventData = async () => {
        console.info(`[TelegramBotRunner] 🔍 Resolving event for Chat ID: "${chatId}" (command: "${cmd}")`);

        if (params?.getEventDataForChat) {
          const res = await params.getEventDataForChat(chatId);
          if (res) {
            console.info(`[TelegramBotRunner] ✅ Resolved via callback params: "${res.eventTitle}" (${res.guests?.length || 0} guests)`);
            return res;
          }
        }

        // 1. Check in-memory / local cache first for instant resolution
        const cached = getCachedTelegramChatEvent(chatId);
        if (cached) {
          let liveGuests = cached.guests || [];
          if (cached.eventId) {
            try {
              const { data: freshGuests } = await supabase
                .from("guests")
                .select("*")
                .eq("event_id", cached.eventId);
              if (freshGuests && freshGuests.length > 0) {
                liveGuests = freshGuests;
                cached.guests = freshGuests;
                registerTelegramChatEvent(chatId, cached);
              }
            } catch (_) {}
          }

          console.info(`[TelegramBotRunner] ✅ Resolved via local event registry: "${cached.eventTitle}" (${liveGuests.length} guests)`);
          logTelegramDiagnostic({
            updateId: update.update_id,
            chatId,
            command: rawText,
            lookupStrategy: "in_memory_cache",
            filterUsed: `cacheKey: ${chatId} (flexible prefix match)`,
            matchedEventId: cached.eventId,
            matchedEventTitle: cached.eventTitle,
            guestCount: liveGuests.length,
            status: "success",
            details: { cacheSource: "memory_or_localStorage" },
          });
          return {
            ...cached,
            guests: liveGuests,
          };
        }

        // 2. Try Supabase Security Definer RPC
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc("get_event_by_telegram_chat_id", {
            _chat_id: chatId,
          } as any);

          if (!rpcError && rpcData && (rpcData as any).eventTitle) {
            const resolved = {
              eventTitle: (rpcData as any).eventTitle,
              eventDate: (rpcData as any).eventDate,
              guests: (rpcData as any).guests || [],
              eventId: (rpcData as any).eventId,
              slug: (rpcData as any).slug,
            };
            registerTelegramChatEvent(chatId, resolved);
            console.info(`[TelegramBotRunner] ✅ Resolved via Supabase RPC: "${resolved.eventTitle}" (${resolved.guests.length} guests)`);
            logTelegramDiagnostic({
              updateId: update.update_id,
              chatId,
              command: rawText,
              lookupStrategy: "supabase_rpc",
              filterUsed: `RPC: get_event_by_telegram_chat_id(_chat_id='${chatId}')`,
              matchedEventId: resolved.eventId,
              matchedEventTitle: resolved.eventTitle,
              guestCount: resolved.guests.length,
              status: "success",
            });
            return resolved;
          }
        } catch (rpcErr) {
          console.debug("[TelegramBotRunner] RPC lookup attempt notice:", rpcErr);
        }

        // 3. Direct database lookup fallback
        try {
          const { data: events, error: evError } = await supabase
            .from("events")
            .select("id, title, slug, event_date, section_visibility")
            .order("created_at", { ascending: false });

          if (evError) {
            console.warn(`[TelegramBotRunner] ⚠️ Supabase select query returned error: ${evError.message}`);
          }

          if (events && events.length > 0) {
            const matched = events.find((e: any) => {
              const cId = e.section_visibility?.telegram_chat_id || (e as any).telegram_chat_id;
              const matches = chatIdsMatch(cId, chatId);
              if (matches) {
                console.info(`[TelegramBotRunner] 🎯 Matched configured ID "${cId}" with incoming Chat ID "${chatId}"`);
              }
              return matches;
            });

            if (matched) {
              const { data: guests } = await supabase
                .from("guests")
                .select("*")
                .eq("event_id", matched.id);

              const resolved = {
                eventTitle: matched.title,
                eventDate: matched.event_date,
                guests: guests || [],
                eventId: matched.id,
                slug: matched.slug,
              };
              registerTelegramChatEvent(chatId, resolved);
              console.info(`[TelegramBotRunner] ✅ Resolved via events table: "${resolved.eventTitle}" (${resolved.guests.length} guests)`);
              logTelegramDiagnostic({
                updateId: update.update_id,
                chatId,
                command: rawText,
                lookupStrategy: "events_table_scan",
                filterUsed: `SELECT * FROM events -> chatIdsMatch(cId, '${chatId}')`,
                matchedEventId: resolved.eventId,
                matchedEventTitle: resolved.eventTitle,
                guestCount: resolved.guests.length,
                status: "success",
              });
              return resolved;
            }
          }
        } catch (dbErr) {
          console.warn("[TelegramBotRunner] Database query exception:", dbErr);
        }

        console.warn(`[TelegramBotRunner] ❌ No event linked to Telegram Chat ID: "${chatId}" across in-memory cache, RPC, or database query.`);
        logTelegramDiagnostic({
          updateId: update.update_id,
          chatId,
          command: rawText,
          lookupStrategy: "none",
          filterUsed: `Lookup across cache, RPC get_event_by_telegram_chat_id, and events table scan with chatId='${chatId}'`,
          status: "no_event_linked",
          details: { error: "Chat ID not linked to any event in the system" },
        });
        return null;
      };

      const isHelpCmd = cmd === "/help" || cmd === "/start" || cmd === "/info";
      const isRsvpCmd = cmd === "/rsvp" || cmd === "/rvsp" || cmd === "/quick" || cmd === "/stats" || cmd === "/stat" || cmd === "/overview" || cmd === "/count";
      const isSummaryCmd =
        cmd === "/summary" ||
        cmd === "/sumary" ||
        cmd === "/sum" ||
        cmd === "/summery" ||
        cmd === "/detail" ||
        cmd === "/details" ||
        cmd === "/guests" ||
        cmd === "/guest" ||
        cmd === "/list" ||
        cmd === "/report" ||
        cmd === "/attending";

      if (isHelpCmd) {
        const eventData = await resolveEventData();
        const helpText = formatTelegramHelpMessage(eventData?.eventTitle, chatId);

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: helpText,
            parse_mode: "HTML",
          }),
        });
        processed++;
      } else if (isRsvpCmd) {
        // 1. Quick Summary Command
        const eventData = await resolveEventData();
        if (eventData) {
          await sendTelegramRsvpQuickSummary({
            chatId,
            botToken: token,
            eventTitle: eventData.eventTitle,
            eventDate: eventData.eventDate,
            guests: eventData.guests,
          });
          processed++;
        } else if (shouldSendUnlinkedNotice(chatId)) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⚠️ <b>រកមិនឃើញកម្មវិធី / No Event Linked</b>\nChat ID: <code>${chatId}</code>\nសូមភ្ជាប់ Chat ID នេះក្នុងផ្ទាំងគ្រប់គ្រងកម្មវិធីរបស់អ្នក។`,
              parse_mode: "HTML",
            }),
          });
          processed++;
        }
      } else if (isSummaryCmd) {
        // 2. Detailed Guest List & Wishes Command
        const eventData = await resolveEventData();
        if (eventData) {
          await sendTelegramRsvpDetailList({
            chatId,
            botToken: token,
            eventTitle: eventData.eventTitle,
            eventDate: eventData.eventDate,
            guests: eventData.guests,
          });
          processed++;
        } else if (shouldSendUnlinkedNotice(chatId)) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⚠️ <b>រកមិនឃើញកម្មវិធី / No Event Linked</b>\nChat ID: <code>${chatId}</code>\nសូមភ្ជាប់ Chat ID នេះក្នុងផ្ទាំងគ្រប់គ្រងកម្មវិធីរបស់អ្នក។`,
              parse_mode: "HTML",
            }),
          });
          processed++;
        }
      }
    }

    // Acknowledge updates with Telegram
    if (lastHandledUpdateOffset > 0) {
      await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastHandledUpdateOffset}`, { method: "GET" });
    }

    return { processedCount: processed };
  } catch (err) {
    console.warn("Error processing Telegram bot commands:", err);
    return { processedCount: 0 };
  }
}
