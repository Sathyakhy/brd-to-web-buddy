import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.startsWith("http"))
  ? process.env.VITE_SUPABASE_URL
  : "https://lyhnvcpkxbbafewkzgjo.supabase.co";
const SUPABASE_KEY = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY && process.env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith("ey"))
  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aG52Y3BreGJiYWZld2t6Z2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDUxODUsImV4cCI6MjA5MjU4MTE4NX0.v1ZHwcIvuIHe1ygiJDhVyifKmkn88l7e-tKx58iMxnY";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8688668764:AAHvH4iO_Jr60UzjZVN_wGDrpe8Tt1FjvcE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeTelegramHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractGuestNameAndWishes(g) {
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

async function sendTelegramMessage(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("sendTelegramMessage error:", err);
  }
}

async function findEventForChat(chatId) {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, slug, event_date, venue, section_visibility")
    .order("created_at", { ascending: false });

  if (error || !events) return null;

  return events.find((e) => {
    const vis = e.section_visibility || {};
    const configuredId = String(vis.telegram_chat_id || e.telegram_chat_id || "").trim();
    return configuredId === String(chatId).trim();
  }) || null;
}

async function fetchGuestsForEvent(eventId) {
  const { data: rawGuests } = await supabase
    .from("guests")
    .select("id, name, token, rsvp_status, party_size, message, responded_at")
    .eq("event_id", eventId);

  const all = rawGuests || [];

  return all.filter((g) => {
    const isUnassigned =
      g.token?.startsWith("broadcast-") &&
      g.rsvp_status === "pending" &&
      !g.responded_at &&
      (!g.message || !g.message.trim());
    return !isUnassigned;
  });
}

function buildQuickSummary(event, guests) {
  const attending = guests.filter((g) => g.rsvp_status === "yes");
  const declined = guests.filter((g) => g.rsvp_status === "no");
  const pending = guests.filter((g) => g.rsvp_status === "pending");
  const totalPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

  const safeTitle = escapeTelegramHtml(event.title || "Wedding Celebration");
  const formattedDate = event.event_date ? escapeTelegramHtml(new Date(event.event_date).toLocaleDateString("en-GB")) : "";

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

function buildDetailList(event, guests) {
  const attending = guests.filter((g) => g.rsvp_status === "yes");
  const declined = guests.filter((g) => g.rsvp_status === "no");
  const totalPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

  const safeTitle = escapeTelegramHtml(event.title || "Wedding Celebration");
  const formattedDate = event.event_date ? escapeTelegramHtml(new Date(event.event_date).toLocaleDateString("en-GB")) : "";

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
    `👥 <b>ចំនួនភ្ញៀវសរុប (Total Headcount):</b> <b>${totalPax}</b> នាក់ (Pax) — ${attending.length} ក្រុម`,
    `━━━━━━━━━━━━━━━━━━`,
    `<b>បញ្ជីភ្ញៀវយល់ព្រមចូលរួម (Attending Guests & Wishes):</b>`,
    ``,
  ];

  const bodyLines = [];

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

  const chunks = [];
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

function buildHelpMessage(event, chatId) {
  const safeEvent = event ? escapeTelegramHtml(event.title) : null;
  return [
    `🤖 <b>21Invite.Online RSVP Bot (@EInvitation_Bot)</b>`,
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

let offset = 0;

async function pollUpdates() {
  const url = offset > 0
    ? `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`
    : `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=20`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !data.result || data.result.length === 0) {
      return;
    }

    for (const update of data.result) {
      offset = Math.max(offset, update.update_id + 1);

      const msg = update.message || update.channel_post;
      if (!msg || !msg.chat || !msg.text) continue;

      const chatId = String(msg.chat.id);
      const rawText = msg.text.trim();
      const cmd = rawText.toLowerCase().split(/\s+/)[0].replace(/@\w+/g, "");

      console.log(`[Bot Runner] Received command "${cmd}" from chat ${chatId}`);

      if (cmd === "/help" || cmd === "/start") {
        const event = await findEventForChat(chatId);
        const helpText = buildHelpMessage(event, chatId);
        await sendTelegramMessage(chatId, helpText);
      } else if (cmd === "/rsvp" || cmd === "/quick" || cmd === "/stats") {
        const event = await findEventForChat(chatId);
        if (event) {
          const guests = await fetchGuestsForEvent(event.id);
          const quickText = buildQuickSummary(event, guests);
          await sendTelegramMessage(chatId, quickText);
        } else {
          await sendTelegramMessage(
            chatId,
            `⚠️ <b>រកមិនឃើញកម្មវិធី / No Event Linked</b>\nChat ID: <code>${chatId}</code>\nសូមភ្ជាប់ Chat ID នេះក្នុងផ្ទាំងគ្រប់គ្រងកម្មវិធីរបស់អ្នក។`
          );
        }
      } else if (cmd === "/summary" || cmd === "/detail" || cmd === "/guests" || cmd === "/list" || cmd === "/report") {
        const event = await findEventForChat(chatId);
        if (event) {
          const guests = await fetchGuestsForEvent(event.id);
          const chunks = buildDetailList(event, guests);
          for (const chunk of chunks) {
            await sendTelegramMessage(chatId, chunk);
          }
        } else {
          await sendTelegramMessage(
            chatId,
            `⚠️ <b>រកមិនឃើញកម្មវិធី / No Event Linked</b>\nChat ID: <code>${chatId}</code>\nសូមភ្ជាប់ Chat ID នេះក្នុងផ្ទាំងគ្រប់គ្រងកម្មវិធីរបស់អ្នក។`
          );
        }
      }
    }
  } catch (err) {
    console.error("[Bot Runner] Polling error:", err.message);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

console.log("[Bot Runner] Starting Telegram bot background runner with long-polling...");

async function startLoop() {
  while (true) {
    try {
      await pollUpdates();
    } catch (e) {
      console.error("[Bot Runner] Loop exception:", e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

startLoop();
