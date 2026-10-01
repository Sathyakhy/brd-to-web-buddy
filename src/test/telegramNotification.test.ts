import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  escapeTelegramHtml,
  sendTelegramRsvpNotification,
  sendTelegramTestNotification,
  sendTelegramRsvpQuickSummary,
  sendTelegramRsvpDetailList,
  formatTelegramRsvpQuickSummary,
  formatTelegramRsvpDetailList,
  formatTelegramHelpMessage,
  extractGuestNameAndWishes,
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

  describe("extractGuestNameAndWishes", () => {
    it("extracts clean name and wishes from broadcast format [Name] Message", () => {
      const res = extractGuestNameAndWishes({
        token: "broadcast-km-01",
        name: "Honored Guest",
        message: "[Sok San] Wishing you a wonderful marriage!",
      });
      expect(res.name).toBe("Sok San");
      expect(res.wishes).toBe("Wishing you a wonderful marriage!");
    });

    it("handles regular named guest without brackets", () => {
      const res = extractGuestNameAndWishes({
        token: "guest-token-123",
        name: "Dara Chan",
        message: "Can't wait to be there!",
      });
      expect(res.name).toBe("Dara Chan");
      expect(res.wishes).toBe("Can't wait to be there!");
    });
  });

  describe("formatTelegramHelpMessage", () => {
    it("formats help message with command list", () => {
      const text = formatTelegramHelpMessage("My Wedding", "-5568784428");
      expect(text).toContain("/rsvp");
      expect(text).toContain("/summary");
      expect(text).toContain("/help");
      expect(text).toContain("My Wedding");
    });
  });

  describe("formatTelegramRsvpQuickSummary", () => {
    it("generates quick headcount overview without full guest breakdown", () => {
      const guests = [
        { name: "Sok", rsvp_status: "yes", party_size: 2 },
        { name: "Dara", rsvp_status: "yes", party_size: 1 },
        { name: "Chhay", rsvp_status: "no", party_size: 1 },
        { name: "John", rsvp_status: "pending", party_size: 1 },
      ];
      const text = formatTelegramRsvpQuickSummary({
        eventTitle: "Sok Wedding",
        guests,
      });

      expect(text).toContain("Quick RSVP Summary");
      expect(text).toContain("3</b> នាក់ / Pax"); // 2 + 1 = 3 pax
      expect(text).toContain("2</b> ក្រុម/នាក់"); // 2 groups
      expect(text).toContain("1</b> នាក់"); // 1 declined
      expect(text).toContain("/summary"); // hint to view full list
      expect(text).not.toContain("💬"); // does not contain individual wishes
    });
  });

  describe("formatTelegramRsvpDetailList", () => {
    it("formats full summary report with guest name, pax and wishes", () => {
      const guests = [
        {
          id: "1",
          name: "Sok San",
          token: "broadcast-km-01",
          rsvp_status: "yes",
          party_size: 2,
          message: "[Sok San] Warmest congratulations!",
          responded_at: "2026-10-01",
        },
        {
          id: "2",
          name: "Dara Chan",
          token: "broadcast-km-02",
          rsvp_status: "yes",
          party_size: 3,
          message: "[Dara Chan] Happy wedding day!",
          responded_at: "2026-10-01",
        },
        {
          id: "3",
          name: "Vireak",
          token: "broadcast-km-03",
          rsvp_status: "no",
          party_size: 1,
          message: "[Vireak] Apologies, cannot attend",
          responded_at: "2026-10-01",
        },
        {
          id: "4",
          name: "Honored Guest",
          token: "broadcast-km-04",
          rsvp_status: "pending",
          party_size: 1,
          message: null,
          responded_at: null,
        },
      ];

      const chunks = formatTelegramRsvpDetailList({
        eventTitle: "Kunsong & Kimsing Wedding",
        eventDate: "2026-11-20",
        guests,
      });

      expect(chunks.length).toBeGreaterThan(0);
      const text = chunks.join("\n");
      expect(text).toContain("Kunsong &amp; Kimsing Wedding");
      expect(text).toContain("Attending");
      expect(text).toContain("5</b> នាក់ (Pax)"); // 2 + 3 = 5 pax
      expect(text).toContain("Sok San");
      expect(text).toContain("2</b> នាក់ (Pax)");
      expect(text).toContain("Warmest congratulations!");
      expect(text).toContain("Dara Chan");
      expect(text).toContain("3</b> នាក់ (Pax)");
      expect(text).toContain("Vireak");
      expect(text).toContain("Declined");
    });
  });

  describe("sendTelegramRsvpQuickSummary and sendTelegramRsvpDetailList", () => {
    it("sends quick summary to Telegram chat", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 128 } }),
      } as any);

      const res = await sendTelegramRsvpQuickSummary({
        chatId: "-5568784428",
        eventTitle: "Kunsong & Kimsing Wedding",
        guests: [{ name: "Sok San", token: "tok1", rsvp_status: "yes", party_size: 2 }],
      });

      expect(res.success).toBe(true);
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.chat_id).toBe("-5568784428");
      expect(body.text).toContain("Quick RSVP Summary");
    });

    it("sends detail list to Telegram chat", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 129 } }),
      } as any);

      const res = await sendTelegramRsvpDetailList({
        chatId: "-5568784428",
        eventTitle: "Kunsong & Kimsing Wedding",
        guests: [{ name: "Sok San", token: "tok1", rsvp_status: "yes", party_size: 2, message: "Best wishes!" }],
      });

      expect(res.success).toBe(true);
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.chat_id).toBe("-5568784428");
      expect(body.text).toContain("Detailed Guest List & Wishes");
      expect(body.text).toContain("Best wishes!");
    });
  });
});
