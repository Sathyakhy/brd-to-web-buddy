import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { processTelegramBotCommands } from "@/utils/telegramNotification";

/**
 * Global background listener that checks for Telegram bot commands
 * (/help, /rsvp, /summary) and answers them automatically using data from Supabase.
 */
export default function TelegramBotListener() {
  useEffect(() => {
    let isCancelled = false;

    const runCheck = async () => {
      if (isCancelled) return;

      try {
        await processTelegramBotCommands({
          getEventDataForChat: async (chatId) => {
            const { data: events } = await supabase
              .from("events")
              .select("id, title, event_date, section_visibility")
              .order("created_at", { ascending: false });

            if (!events) return null;

            const matched = events.find((e) => {
              const vis = (e.section_visibility as any) ?? {};
              const configuredId = String(vis.telegram_chat_id || (e as any).telegram_chat_id || "").trim();
              return configuredId === chatId;
            });

            if (!matched) return null;

            const { data: guests } = await supabase
              .from("guests")
              .select("id, name, token, rsvp_status, party_size, message, responded_at")
              .eq("event_id", matched.id);

            return {
              eventTitle: matched.title,
              eventDate: matched.event_date,
              guests: guests || [],
            };
          },
        });
      } catch (err) {
        console.warn("Telegram bot listener error:", err);
      }
    };

    // Initial check
    runCheck();

    // Check every 3 seconds for near-instant responsiveness
    const timer = setInterval(runCheck, 3000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, []);

  return null;
}
