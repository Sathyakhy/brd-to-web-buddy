/**
 * Cloudflare Worker for Telegram RSVP Bot (@EInvitation_Bot)
 * 24/7 Serverless Webhook Handler (Zero Browser Tabs Required)
 */

const SUPABASE_URL = "https://lyhnvcpkxbbafewkzgjo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aG52Y3BreGJiYWZld2t6Z2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDUxODUsImV4cCI6MjA5MjU4MTE4NX0.v1ZHwcIvuIHe1ygiJDhVyifKmkn88l7e-tKx58iMxnY";
const DEFAULT_BOT_TOKEN = "8688668764:AAEgS0I4SHxevvGIYvKXAjajCG3TIioCwZc";

function normalizeChatId(id) {
  if (!id) return "";
  return String(id).trim().replace(/^-100/, "-");
}

function chatIdsMatch(a, b) {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  if (normalizeChatId(strA) === normalizeChatId(strB)) return true;
  const numA = strA.replace(/^-/, "").replace(/^100/, "");
  const numB = strB.replace(/^-/, "").replace(/^100/, "");
  return numA.length > 4 && numA === numB;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractGuestNameAndMessage(g) {
  let name = g.name || "Honored Guest";
  let wishes = (g.message || "").trim();

  if (g.token && g.token.startsWith("broadcast-") && wishes.startsWith("[")) {
    const match = wishes.match(/^\[(.*?)\](?:\s*(.*))?$/s);
    if (match && match[1]?.trim()) {
      name = match[1].trim();
      wishes = (match[2] || "").trim();
    }
  }
  return { name, wishes };
}

async function sendTelegramMessage(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });
}

export default {
  async fetch(request, env) {
    const BOT_TOKEN = env?.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const url = new URL(request.url);

    // Health check endpoint
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "21Invite Telegram RSVP Bot Cloudflare Worker",
          bot: "@EInvitation_Bot",
          time: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const update = await request.json();
      const msg = update.message || update.channel_post;
      if (!msg || !msg.chat || !msg.text) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const chatId = String(msg.chat.id);
      const text = msg.text.trim();
      const cmd = text.toLowerCase().split(/\s+/)[0].replace(/@\w+/g, "");

      const isSummary =
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
      const isRsvp =
        cmd === "/rsvp" ||
        cmd === "/rvsp" ||
        cmd === "/quick" ||
        cmd === "/stats" ||
        cmd === "/stat" ||
        cmd === "/overview" ||
        cmd === "/count";
      const isHelp = cmd === "/help" || cmd === "/start" || cmd === "/info";

      if (!isSummary && !isRsvp && !isHelp) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (isHelp) {
        const helpText = [
          `🤖 <b>21Invite.Online RSVP Bot (@EInvitation_Bot)</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `Commands:`,
          `• <b>/summary</b> — Share full RSVP attendance summary, pax & wishes`,
          `• <b>/rsvp</b> — Quick overview of RSVP counts`,
          `• <b>/help</b> — Show available commands`,
          `━━━━━━━━━━━━━━━━━━`,
          `Group Chat ID: <code>${chatId}</code>`,
        ].join("\n");
        await sendTelegramMessage(BOT_TOKEN, chatId, helpText);
        return new Response(JSON.stringify({ ok: true, command: "help" }));
      }

      // 1. Try Supabase Security Definer RPC: get_event_by_telegram_chat_id
      let eventData = null;
      try {
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_event_by_telegram_chat_id`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _chat_id: chatId }),
        });

        if (rpcRes.ok) {
          const rpcData = await rpcRes.json();
          if (rpcData && rpcData.eventTitle) {
            eventData = rpcData;
          }
        }
      } catch (_) {}

      // 2. Fallback direct table query
      if (!eventData) {
        try {
          const evRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,slug,event_date,section_visibility`, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          });
          if (evRes.ok) {
            const events = await evRes.json();
            const matched = (events || []).find((e) => {
              const cId = e.section_visibility?.telegram_chat_id || e.telegram_chat_id;
              return chatIdsMatch(cId, chatId);
            });

            if (matched) {
              const gRes = await fetch(`${SUPABASE_URL}/rest/v1/guests?event_id=eq.${matched.id}&select=*`, {
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
              });
              const guests = gRes.ok ? await gRes.json() : [];
              eventData = {
                eventId: matched.id,
                eventTitle: matched.title,
                eventDate: matched.event_date,
                slug: matched.slug,
                guests: guests || [],
              };
            }
          }
        } catch (_) {}
      }

      if (!eventData) {
        const notFoundText = [
          `⚠️ <b>រកមិនឃើញកម្មវិធី / No Event Linked</b>`,
          `Chat ID: <code>${chatId}</code>`,
          `សូមភ្ជាប់ Chat ID នេះក្នុងផ្ទាំងគ្រប់គ្រងកម្មវិធីរបស់អ្នក។`,
        ].join("\n");
        await sendTelegramMessage(BOT_TOKEN, chatId, notFoundText);
        return new Response(JSON.stringify({ ok: true, matched: false }));
      }

      // Calculate counts and format response
      const allGuests = eventData.guests || [];
      const attending = allGuests.filter((g) => g.rsvp_status === "yes");
      const declined = allGuests.filter((g) => g.rsvp_status === "no");
      const totalAttendingPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);
      const totalDeclinedPax = declined.length;

      const dateStr = eventData.eventDate
        ? new Date(eventData.eventDate).toLocaleDateString("en-GB")
        : "—";

      const timeNow = new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Phnom_Penh",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (isRsvp) {
        // Quick summary
        const quickText = [
          `📊 <b>បច្ចុប្បន្នភាពវត្តមានភ្ញៀវ / RSVP Quick Update</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `💍 <b>កម្មវិធី (Event):</b> ${escapeHtml(eventData.eventTitle)}`,
          `📅 <b>កាលបរិច្ឆេទ (Date):</b> ${dateStr}`,
          `👥 <b>យល់ព្រមចូលរួម (Attending):</b> <b>${totalAttendingPax} នាក់</b> (Pax) — ${attending.length} ក្រុម`,
          `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${totalDeclinedPax} នាក់</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `⏰ <i>ធ្វើបច្ចុប្បន្នភាពនៅ ${timeNow} (Phnom Penh)</i>`,
        ].join("\n");
        await sendTelegramMessage(BOT_TOKEN, chatId, quickText);
      } else {
        // Full detailed list
        const lines = [
          `📋 <b>បញ្ជីឈ្មោះភ្ញៀវ និងពាក្យជូនពរ / Detailed Guest List & Wishes</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `💍 <b>កម្មវិធី (Event):</b> ${escapeHtml(eventData.eventTitle)}`,
          `📅 <b>កាលបរិច្ឆេទ (Date):</b> ${dateStr}`,
          `👥 <b>យល់ព្រមចូលរួម (Attending):</b> <b>${totalAttendingPax} នាក់</b> (Pax) — ${attending.length} ក្រុម`,
          `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${totalDeclinedPax} នាក់</b>`,
          `━━━━━━━━━━━━━━━━━━`,
          `<b>បញ្ជីភ្ញៀវយល់ព្រមចូលរួម (Attending Guests & Wishes):</b>\n`,
        ];

        if (attending.length === 0) {
          lines.push(`<i>មិនទាន់មានភ្ញៀវយល់ព្រមចូលរួមនៅឡើយទេ។ / No confirmed attendees yet.</i>\n`);
        } else {
          attending.forEach((g, idx) => {
            const { name, wishes } = extractGuestNameAndMessage(g);
            const pax = Number(g.party_size) || 1;
            lines.push(`${idx + 1}. <b>${escapeHtml(name)}</b> — 👥 ${pax} នាក់ (Pax)`);
            if (wishes) {
              lines.push(`   💬 <i>"${escapeHtml(wishes)}"</i>`);
            }
          });
        }

        lines.push(`━━━━━━━━━━━━━━━━━━`);
        lines.push(`❌ <b>ភ្ញៀវសុំទោសមិនអាចចូលរួម / Declined & Regrets (${totalDeclinedPax} នាក់):</b>`);
        if (declined.length === 0) {
          lines.push(`<i>គ្មានភ្ញៀវបដិសេធទេ / None</i>`);
        } else {
          declined.forEach((g, idx) => {
            const { name, wishes } = extractGuestNameAndMessage(g);
            lines.push(`${idx + 1}. <b>${escapeHtml(name)}</b> — ❌ មិនអាចចូលរួម (Declined)`);
            if (wishes) {
              lines.push(`   💬 <i>"${escapeHtml(wishes)}"</i>`);
            }
          });
        }

        lines.push(`━━━━━━━━━━━━━━━━━━`);
        lines.push(`⏰ <i>ធ្វើបច្ចុប្បន្នភាពនៅ ${timeNow} (Phnom Penh)</i>`);

        await sendTelegramMessage(BOT_TOKEN, chatId, lines.join("\n"));
      }

      return new Response(JSON.stringify({ ok: true, processed: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
