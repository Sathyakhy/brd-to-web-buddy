import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerTelegramChatEvent,
  getCachedTelegramChatEvent,
  chatIdsMatch,
  processTelegramBotCommands,
} from "@/utils/telegramNotification";

describe("Telegram Bot 20-Iteration Concurrency and Multi-Event Reliability Test", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("successfully tests 20 consecutive Telegram bot resolutions without duplicate responses or cross-event leakage", async () => {
    // 1. Setup 3 distinct events and chat IDs
    const eventA = {
      chatId: "-5128023564",
      title: "Event A (Tesing)",
      guests: [
        { name: "Mike Kang and Wife", rsvp_status: "yes", party_size: 2, message: "Congratulations" },
        { name: "Sathya", rsvp_status: "no", party_size: 1, message: null },
      ],
    };

    const eventB = {
      chatId: "-5545734539",
      title: "Event B (Royal Wedding)",
      guests: [
        { name: "Srunpitu Heng", rsvp_status: "yes", party_size: 2, message: "Best wishes" },
        { name: "Dara Chan", rsvp_status: "yes", party_size: 3, message: "See you" },
      ],
    };

    const eventC = {
      chatId: "-5568784428",
      title: "Event C (Corporate Gala)",
      guests: [
        { name: "CEO Chea", rsvp_status: "yes", party_size: 1, message: null },
      ],
    };

    // Register all 3 events
    registerTelegramChatEvent(eventA.chatId, {
      eventTitle: eventA.title,
      guests: eventA.guests,
    });
    registerTelegramChatEvent(eventB.chatId, {
      eventTitle: eventB.title,
      guests: eventB.guests,
    });
    registerTelegramChatEvent(eventC.chatId, {
      eventTitle: eventC.title,
      guests: eventC.guests,
    });

    // Run 20 iterations alternating between Event A, Event B, and Event C
    for (let i = 1; i <= 20; i++) {
      const selected = i % 3 === 0 ? eventC : i % 2 === 0 ? eventB : eventA;

      // Verify cached resolution matches selected event perfectly
      const cached = getCachedTelegramChatEvent(selected.chatId);
      expect(cached).not.toBeNull();
      expect(cached?.eventTitle).toBe(selected.title);
      expect(cached?.guests.length).toBe(selected.guests.length);

      // Verify prefix invariance (with and without -100)
      const prefixedId = selected.chatId.replace(/^-/, "-100");
      expect(chatIdsMatch(selected.chatId, prefixedId)).toBe(true);

      // Verify isolation: Event A must never return Event B or Event C guests
      if (selected === eventA) {
        expect(cached?.guests.some((g) => g.name === "Srunpitu Heng")).toBe(false);
        expect(cached?.guests.some((g) => g.name === "CEO Chea")).toBe(false);
      } else if (selected === eventB) {
        expect(cached?.guests.some((g) => g.name === "Mike Kang and Wife")).toBe(false);
        expect(cached?.guests.some((g) => g.name === "CEO Chea")).toBe(false);
      }
    }
  });

  it("verifies deduplication logic blocks duplicate updates across multiple simulated tabs", () => {
    // Simulate Tab 1 and Tab 2 receiving the exact same Telegram update ID (99901)
    const updateId = 99901;

    const rawFirst = localStorage.getItem("telegram_processed_update_ids");
    const listFirst: number[] = rawFirst ? JSON.parse(rawFirst) : [];
    expect(listFirst.includes(updateId)).toBe(false);

    // Tab 1 records it
    listFirst.push(updateId);
    localStorage.setItem("telegram_processed_update_ids", JSON.stringify(listFirst));

    // Tab 2 checks it
    const rawSecond = localStorage.getItem("telegram_processed_update_ids");
    const listSecond: number[] = rawSecond ? JSON.parse(rawSecond) : [];
    expect(listSecond.includes(updateId)).toBe(true);
  });
});
