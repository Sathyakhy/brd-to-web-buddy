export const DEFAULT_TELEGRAM_BOT_TOKEN = "8688668764:AAHvH4iO_Jr60UzjZVN_wGDrpe8Tt1FjvcE";
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
 * Sends an RSVP notification to the specified Telegram group chat ID.
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
