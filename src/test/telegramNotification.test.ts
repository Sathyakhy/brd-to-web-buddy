import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  escapeTelegramHtml,
  sendTelegramRsvpNotification,
  sendTelegramTestNotification,
  DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_BOT_USERNAME,
} from "@/utils/telegramNotification";

describe("Telegram Notification Utility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("escapeTelegramHtml", () => {
    it("escapes special HTML characters for Telegram", () => {
      expect(escapeTelegramHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
      expect(escapeTelegramHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert('xss')&lt;/script&gt;"
      );
      expect(escapeTelegramHtml('He said "Congratulations"')).toBe(
        "He said &quot;Congratulations&quot;"
      );
      expect(escapeTelegramHtml(null)).toBe("");
      expect(escapeTelegramHtml(undefined)).toBe("");
    });
  });

  describe("sendTelegramRsvpNotification", () => {
    it("formats and posts attending RSVP message correctly to Telegram API", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 123 } }),
      } as any);

      const res = await sendTelegramRsvpNotification({
        chatId: "-1001234567890",
        eventTitle: "Sok & Chantrea Wedding",
        guestName: "Mr. Sok San & Partner",
        status: "yes",
        partySize: 2,
        message: "Wishing you a lifetime of love and happiness!",
      });

      expect(res.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain(DEFAULT_TELEGRAM_BOT_TOKEN);
      expect(url).toContain("/sendMessage");

      const body = JSON.parse(options?.body as string);
      expect(body.chat_id).toBe("-1001234567890");
      expect(body.parse_mode).toBe("HTML");
      expect(body.text).toContain("Sok &amp; Chantrea Wedding");
      expect(body.text).toContain("Mr. Sok San &amp; Partner");
      expect(body.text).toContain("Joyfully Attending");
      expect(body.text).toContain("2</b> នាក់ / Guests");
      expect(body.text).toContain("Wishing you a lifetime of love and happiness!");
    });

    it("formats declining RSVP message correctly", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 124 } }),
      } as any);

      const res = await sendTelegramRsvpNotification({
        chatId: "-1001234567890",
        eventTitle: "Sok & Chantrea Wedding",
        guestName: "Dara Chan",
        status: "no",
        partySize: 1,
        message: "Sorry, I am out of town.",
      });

      expect(res.success).toBe(true);
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.text).toContain("Dara Chan");
      expect(body.text).toContain("Regretfully Declined");
      expect(body.text).toContain("Sorry, I am out of town.");
    });

    it("handles edited response header", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 125 } }),
      } as any);

      const res = await sendTelegramRsvpNotification({
        chatId: "-1001234567890",
        eventTitle: "Sok & Chantrea Wedding",
        guestName: "Dara Chan",
        status: "yes",
        partySize: 3,
        isEdit: true,
      });

      expect(res.success).toBe(true);
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.text).toContain("RSVP Response Updated");
    });

    it("returns error when Telegram API rejects request", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({
          ok: false,
          description: "Bad Request: chat not found",
        }),
      } as any);

      const res = await sendTelegramRsvpNotification({
        chatId: "-1009999999999",
        eventTitle: "Wedding",
        guestName: "Guest",
        status: "yes",
        partySize: 1,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("chat not found");
    });
  });

  describe("sendTelegramTestNotification", () => {
    it("sends test notification with bot username and event info", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 126 } }),
      } as any);

      const res = await sendTelegramTestNotification("-1001234567890", "Test Event");
      expect(res.success).toBe(true);

      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.text).toContain(DEFAULT_TELEGRAM_BOT_USERNAME);
      expect(body.text).toContain("Telegram Notification Test");
    });
  });
});
