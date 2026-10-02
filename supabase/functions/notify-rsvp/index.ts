const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_BOT_TOKEN = "8688668764:AAEgS0I4SHxevvGIYvKXAjajCG3TIioCwZc";

function escapeTelegramHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      chatId,
      botToken,
      eventTitle,
      guestName,
      status,
      partySize,
      message,
      isEdit,
    } = body;

    const token = (botToken || "").trim() || Deno.env.get("TELEGRAM_BOT_TOKEN") || DEFAULT_BOT_TOKEN;
    const targetChatId = (chatId || "").trim() || Deno.env.get("TELEGRAM_DEFAULT_CHAT_ID");

    if (!targetChatId) {
      return new Response(JSON.stringify({ error: "Missing chatId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await telegramRes.json();
    return new Response(JSON.stringify(data), {
      status: telegramRes.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
