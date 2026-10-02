import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_BOT_TOKEN = "8688668764:AAHvH4iO_Jr60UzjZVN_wGDrpe8Tt1FjvcE";

function normalizeChatId(id: string | number | null | undefined): string {
  if (!id) return "";
  return String(id).trim().replace(/^-100/, "-");
}

function chatIdsMatch(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  if (normalizeChatId(strA) === normalizeChatId(strB)) return true;
  const numA = strA.replace(/^-/, "").replace(/^100/, "");
  const numB = strB.replace(/^-/, "").replace(/^100/, "");
  return numA.length > 4 && numA === numB;
}

function escapeTelegramHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractGuestNameAndMessage(g: any): { name: string; wishes: string } {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://lyhnvcpkxbbafewkzgjo.supabase.co";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || DEFAULT_BOT_TOKEN;

  try {
    const update = await req.json();
    const msg = update.message || update.channel_post;
    if (!msg || !msg.chat || !msg.text) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = String(msg.chat.id);
    const text = msg.text.trim();
    const cmd = text.toLowerCase().split(/\s+/)[0].replace(/@\w+/g, "");

    // Check for supported commands (case-insensitive & bot username stripped)
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
    const isRsvp = cmd === "/rsvp" || cmd === "/rvsp" || cmd === "/quick" || cmd === "/stats" || cmd === "/stat" || cmd === "/overview" || cmd === "/count";
    const isHelp = cmd === "/help" || cmd === "/start" || cmd === "/info";

    if (!isSummary && !isRsvp && !isHelp) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isHelp) {
      const helpText = [
        `🤖 <b>21Invite.Online RSVP Bot (@EInvitation_Bot)</b>`,
        `━━━━━━━━━━━━━━━━━━`,
        `Commands:`,
        `• <b>/summary</b> — Share full RSVP attendance summary, pax & wishes`,
        `• <b>/rsvp</b> — Quick overview of RSVP counts`,
        `• <b>/help</b> — Show this help message`,
        `━━━━━━━━━━━━━━━━━━`,
        `<i>Add this bot to your wedding team group to receive instant RSVP alerts!</i>`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: helpText,
          parse_mode: "HTML",
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect to Supabase to find the event linked to this Telegram group
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: events, error: eventErr } = await supabase
      .from("events")
      .select("id, title, slug, event_date, venue, section_visibility")
      .order("created_at", { ascending: false });

    if (eventErr || !events) {
      console.error("Error fetching events:", eventErr);
      return new Response(JSON.stringify({ error: "Failed to query database" }), { status: 500 });
    }

    const matchedEvent = events.find((e) => {
      const vis = (e.section_visibility as any) ?? {};
      const configuredId = vis.telegram_chat_id || (e as any).telegram_chat_id || "";
      return chatIdsMatch(configuredId, chatId);
    });

    if (!matchedEvent) {
      const notFoundMsg = [
        `⚠️ <b>រកមិនឃើញកម្មវិធីដែលភ្ជាប់ជាមួយក្រុមនេះទេ / No Event Linked</b>`,
        `━━━━━━━━━━━━━━━━━━`,
        `Group Chat ID: <code>${chatId}</code>`,
        ``,
        `សូមចូលទៅកាន់ Admin ឬ Customer Dashboard ដើម្បីបញ្ចូល Chat ID នេះក្នុងកម្មវិធីរបស់អ្នក។`,
        `<i>(Please configure this Chat ID in your event settings.)</i>`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: notFoundMsg,
          parse_mode: "HTML",
        }),
      });

      return new Response(JSON.stringify({ ok: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch guests for this event
    const { data: rawGuests } = await supabase
      .from("guests")
      .select("id, name, token, rsvp_status, party_size, message, responded_at")
      .eq("event_id", matchedEvent.id);

    const allGuests = rawGuests || [];

    // Filter out unassigned broadcast slots
    const visibleGuests = allGuests.filter((g) => {
      const isUnassigned =
        g.token?.startsWith("broadcast-") &&
        g.rsvp_status === "pending" &&
        !g.responded_at &&
        (!g.message || !g.message.trim());
      return !isUnassigned;
    });

    const attending = visibleGuests.filter((g) => g.rsvp_status === "yes");
    const declined = visibleGuests.filter((g) => g.rsvp_status === "no");
    const pending = visibleGuests.filter((g) => g.rsvp_status === "pending");
    const totalPax = attending.reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

    const safeTitle = escapeTelegramHtml(matchedEvent.title);
    const phnomPenhTime = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Phnom_Penh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isRsvp) {
      // Short overview
      const rsvpText = [
        `📊 <b>ស្ថានភាព RSVP សង្ខេប / RSVP Overview</b>`,
        `━━━━━━━━━━━━━━━━━━`,
        `💍 <b>កម្មវិធី (Event):</b> ${safeTitle}`,
        `👥 <b>ចំនួនភ្ញៀវចូលរួមសរុប (Total Attending):</b> <b>${totalPax}</b> នាក់ / Pax`,
        `✅ <b>យល់ព្រមចូលរួម (Attending):</b> ${attending.length} ក្រុម/នាក់`,
        `❌ <b>មិនអាចចូលរួម (Declined):</b> ${declined.length} នាក់`,
        `⏳ <b>កំពុងរង់ចាំ (Pending):</b> ${pending.length} នាក់`,
        `━━━━━━━━━━━━━━━━━━`,
        `💡 <i>វាយ <b>/summary</b> ដើម្បីមើលបញ្ជីឈ្មោះភ្ញៀវ និងពាក្យជូនពរលម្អិត។</i>`,
        `⏰ <i>${phnomPenhTime}</i>`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: rsvpText,
          parse_mode: "HTML",
        }),
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full Detailed Summary for /summary
    const headerLines = [
      `📊 <b>របាយការណ៍វត្តមានភ្ញៀវ និងពាក្យជូនពរ / RSVP Summary & Wishes</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `💍 <b>កម្មវិធី (Event):</b> ${safeTitle}`,
      `👥 <b>ចំនួនភ្ញៀវចូលរួមសរុប (Total Headcount):</b> <b>${totalPax}</b> នាក់ (Pax)`,
      `✅ <b>យល់ព្រមចូលរួម (Attending):</b> <b>${attending.length}</b> ក្រុម/នាក់`,
      `❌ <b>មិនអាចចូលរួម (Declined):</b> <b>${declined.length}</b> នាក់`,
      `⏳ <b>កំពុងរង់ចាំ (Pending):</b> <b>${pending.length}</b> នាក់`,
      `━━━━━━━━━━━━━━━━━━`,
      `📋 <b>បញ្ជីឈ្មោះភ្ញៀវយល់ព្រមចូលរួម (Attending Guests & Wishes):</b>`,
      ``,
    ];

    const guestLines: string[] = [];

    if (attending.length === 0) {
      guestLines.push(`<i>មិនទាន់មានភ្ញៀវយល់ព្រមចូលរួមនៅឡើយទេ។ / No confirmed attendees yet.</i>`);
    } else {
      attending.forEach((g, idx) => {
        const { name, wishes } = extractGuestNameAndMessage(g);
        const pax = Number(g.party_size) || 1;
        const safeGName = escapeTelegramHtml(name);
        const safeWishes = escapeTelegramHtml(wishes);

        let item = `${idx + 1}. <b>${safeGName}</b> — 👥 <b>${pax}</b> នាក់ (Pax)`;
        if (safeWishes) {
          item += `\n   💬 <i>"${safeWishes}"</i>`;
        }
        guestLines.push(item);
      });
    }

    if (declined.length > 0) {
      guestLines.push(``);
      guestLines.push(`━━━━━━━━━━━━━━━━━━`);
      guestLines.push(`❌ <b>ភ្ញៀវសុំទោសមិនអាចចូលរួម / Declined (${declined.length} នាក់):</b>`);
      declined.forEach((g, idx) => {
        const { name, wishes } = extractGuestNameAndMessage(g);
        const safeGName = escapeTelegramHtml(name);
        const safeWishes = escapeTelegramHtml(wishes);
        let item = `${idx + 1}. <s>${safeGName}</s>`;
        if (safeWishes) {
          item += ` (<i>"${safeWishes}"</i>)`;
        }
        guestLines.push(item);
      });
    }

    guestLines.push(``);
    guestLines.push(`━━━━━━━━━━━━━━━━━━`);
    guestLines.push(`⏰ <i>ធ្វើបច្ចុប្បន្នភាពនៅ ${phnomPenhTime} (Phnom Penh)</i>`);

    // Combine lines and chunk into messages under 3800 characters to prevent Telegram API overflow
    const fullText = [...headerLines, ...guestLines].join("\n");

    if (fullText.length <= 4000) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullText,
          parse_mode: "HTML",
        }),
      });
    } else {
      // Chunk into smaller messages
      const chunks: string[] = [];
      let currentChunk = headerLines.join("\n") + "\n";

      for (const line of guestLines) {
        if ((currentChunk + line + "\n").length > 3800) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += line + "\n";
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk);
      }

      for (const chunk of chunks) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: chunk,
            parse_mode: "HTML",
          }),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
