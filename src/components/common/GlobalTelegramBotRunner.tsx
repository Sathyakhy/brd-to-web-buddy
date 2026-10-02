import { useEffect } from "react";
import { processTelegramBotCommands, isTabLeader } from "@/utils/telegramNotification";
import { warmupChatToEventMap } from "@/lib/telegramChatMap";

/**
 * Global background listener that continuously processes Telegram bot commands
 * (/summary, /rsvp, /help) across any linked events in the system.
 * Uses cross-tab leader election to ensure only ONE tab polls and replies,
 * with a pre-warmed cached map of chat_id to event_id for fast O(1) lookups.
 */
export function GlobalTelegramBotRunner() {
  useEffect(() => {
    let isCancelled = false;
    let isBusy = false;

    // Warm up the cached chat_id -> event_id map immediately on mount
    warmupChatToEventMap().catch(() => {});

    const poll = async () => {
      if (isCancelled || isBusy || !isTabLeader() || document.hidden) return;
      isBusy = true;
      try {
        await processTelegramBotCommands();
      } catch (err) {
        // Safe silent catch
      } finally {
        isBusy = false;
      }
    };

    // Run initial check immediately
    poll();

    // Fast active polling every 3 seconds (only leader tab executes)
    const interval = setInterval(poll, 3000);

    // Periodic map refresh every 60 seconds to keep cache fresh
    const mapWarmupInterval = setInterval(() => {
      if (!document.hidden) {
        warmupChatToEventMap().catch(() => {});
      }
    }, 60000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      clearInterval(mapWarmupInterval);
    };
  }, []);

  return null;
}
