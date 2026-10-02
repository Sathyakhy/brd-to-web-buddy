import { useEffect } from "react";
import { processTelegramBotCommands, isTabLeader } from "@/utils/telegramNotification";

/**
 * Global background listener that continuously processes Telegram bot commands
 * (/summary, /rsvp, /help) across any linked events in the system.
 * Uses cross-tab leader election to ensure only ONE tab polls and replies.
 */
export function GlobalTelegramBotRunner() {
  useEffect(() => {
    let isCancelled = false;
    let isBusy = false;

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

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
