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
 * Builds formatted Telegram HTML chunks for the full RSVP summary report,
 * ensuring each chunk stays under 3800 characters to prevent Telegram API truncation.
 */
export function formatTelegramRsvpSummary(params: {
  eventTitle: string;
  eventDate?: string | null;
  guests: any[];
}): string[] {
  const { eventTitle, eventDate, guests } = params;

  // Filter out unassigned broadcast slots
  const visible = guests.filter((g) => {
    const isUnassigned =
      g.token?.startsWith("broadcast-") &&
      g.rsvp_status === "pending" &&
      !g.responded_at &&
      (!g.message || !g.message.trim());
    return !isUnassigned;
  });

  const attending = visible.filter((g) => g.rsvp_status === "yes");
  const declined = visible.filter((g) => g.rsvp_status === "no");
  const pending = visible.filter((g) => g.rsvp_status === "pending");
  const totalPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

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
    `📊 <b>របាយការណ៍វត្តមានភ្ញៀវ និងពាក្យជូនពរ / RSVP Summary & Wishes</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `💍 <b>កម្មវិធី (Event):</b> ${safeTitle}`,
    ...(formattedDate ? [`📅 <b>កាលបរិច្ឆេទ (Date):</b> ${formattedDate}`] : []),
    `👥 <b>ចំនួនភ្ញៀវចូលរួមសរុប (Total Headcount):</b> <b>${totalPax}</b> នាក់ (Pax)`,
    `✅ <b>យល់ព្រមចូលរួម (Attending):</b> <b>${attending.length}</b> ក្រុម/នាក់`,
    `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${declined.length}</b> នាក់`,
    `⏳ <b>កំពុងរង់ចាំ (Pending):</b> <b>${pending.length}</b> នាក់`,
    `━━━━━━━━━━━━━━━━━━`,
    `📋 <b>បញ្ជីឈ្មោះភ្ញៀវយល់ព្រមចូលរួម (Attending Guests & Wishes):</b>`,
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

  if (declined.length > 0) {
    bodyLines.push(``);
    bodyLines.push(`━━━━━━━━━━━━━━━━━━`);
    bodyLines.push(`❌ <b>ភ្ញៀវសុំទោសមិនអាចចូលរួម / Declined (${declined.length} នាក់):</b>`);
    declined.forEach((g, idx) => {
      const { name, wishes } = extractGuestNameAndWishes(g);
      const safeGName = escapeTelegramHtml(name);
      const safeWishes = escapeTelegramHtml(wishes);
      let item = `${idx + 1}. <s>${safeGName}</s>`;
      if (safeWishes) {
        item += ` (<i>"${safeWishes}"</i>)`;
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
 * Sends the full RSVP Summary report (guest names, pax, wishes, headcount) to the Telegram group.
 */
export async function sendTelegramRsvpSummary(params: {
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

  const chunks = formatTelegramRsvpSummary({ eventTitle, eventDate, guests });

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
        return { success: false, error: data.description || "Failed to send summary" };
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send RSVP summary to Telegram:", err);
    return { success: false, error: err?.message || "Network error" };
  }
}

let lastHandledUpdateOffset = 0;

/**
 * Checks for commands like /summary or /rsvp in Telegram updates and replies with the event summary.
 */
export async function processTelegramBotCommands(params: {
  botToken?: string | null;
  getEventDataForChat: (chatId: string) => Promise<{
    eventTitle: string;
    eventDate?: string | null;
    guests: any[];
  } | null>;
}): Promise<{ processedCount: number }> {
  const token = (params.botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;

  try {
    const url = lastHandledUpdateOffset > 0
      ? `https://api.telegram.org/bot${token}/getUpdates?offset=${lastHandledUpdateOffset}`
      : `https://api.telegram.org/bot${token}/getUpdates`;

    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (!data.ok || !data.result || data.result.length === 0) {
      return { processedCount: 0 };
    }

    let processed = 0;

    for (const update of data.result) {
      lastHandledUpdateOffset = Math.max(lastHandledUpdateOffset, update.update_id + 1);

      const msg = update.message || update.channel_post;
      if (!msg || !msg.chat || !msg.text) continue;

      const chatId = String(msg.chat.id);
      const text = msg.text.trim().toLowerCase();

      if (text.startsWith("/summary") || text.startsWith("/report") || text.startsWith("/rsvp")) {
        const eventData = await params.getEventDataForChat(chatId);
        if (eventData) {
          await sendTelegramRsvpSummary({
            chatId,
            botToken: token,
            eventTitle: eventData.eventTitle,
            eventDate: eventData.eventDate,
            guests: eventData.guests,
          });
          processed++;
        } else {
          // Send not found notice
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

