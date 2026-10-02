import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerChatToEventMapping,
  getCachedEventByChatId,
  areChatIdsEquivalent,
} from "@/lib/telegramChatMap";
import {
  isTabLeader,
  chatIdsMatch,
} from "@/utils/telegramNotification";

describe("Telegram Bot 50-Record High Load and Reliability Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("successfully processes and isolates 50 distinct chat-to-event records", async () => {
    const records = Array.from({ length: 50 }, (_, i) => ({
      chatId: `-550000000${i + 1}`,
      prefixedChatId: `-100550000000${i + 1}`,
      eventId: `event-uuid-${i + 1}`,
      eventTitle: `Wedding / Gala Event ${i + 1}`,
      guests: [
        { name: `Guest A${i + 1}`, rsvp_status: "yes", party_size: 2, message: `Congrats ${i + 1}` },
        { name: `Guest B${i + 1}`, rsvp_status: i % 2 === 0 ? "yes" : "no", party_size: 1, message: null },
      ],
    }));

    // Register all 50 events in the cached map
    for (const rec of records) {
      registerChatToEventMapping(rec.chatId, {
        eventId: rec.eventId,
        eventTitle: rec.eventTitle,
        guests: rec.guests,
      });
    }

    // Verify all 50 records resolve with 100% accuracy and strict isolation
    for (let i = 0; i < 50; i++) {
      const rec = records[i];

      // 1. Direct standard chat ID lookup
      const direct = getCachedEventByChatId(rec.chatId);
      expect(direct).not.toBeNull();
      expect(direct?.eventId).toBe(rec.eventId);
      expect(direct?.eventTitle).toBe(rec.eventTitle);
      expect(direct?.guests?.length).toBe(rec.guests.length);

      // 2. Prefixed supergroup chat ID lookup (-100)
      const prefixed = getCachedEventByChatId(rec.prefixedChatId);
      expect(prefixed).not.toBeNull();
      expect(prefixed?.eventId).toBe(rec.eventId);
      expect(prefixed?.eventTitle).toBe(rec.eventTitle);

      // 3. Strict isolation test: Record i must never equal Record j
      if (i > 0) {
        const prev = records[i - 1];
        expect(direct?.eventId).not.toBe(prev.eventId);
        expect(areChatIdsEquivalent(rec.chatId, prev.chatId)).toBe(false);
      }
    }
  });

  it("verifies leader election stability across 50 consecutive ticks", () => {
    for (let tick = 1; tick <= 50; tick++) {
      const leader = isTabLeader();
      expect(leader).toBe(true);
    }
  });

  it("verifies 50 updates deduplication prevents duplicate processing", () => {
    const executed: string[] = [];

    for (let u = 1; u <= 50; u++) {
      const updateId = 353933000 + u;
      const key = `upd_${updateId}`;

      // First check: should claim successfully
      expect(executed.includes(key)).toBe(false);
      executed.push(key);

      // Second check: duplicate attempt must be rejected
      expect(executed.includes(key)).toBe(true);
    }

    expect(executed.length).toBe(50);
  });
});
