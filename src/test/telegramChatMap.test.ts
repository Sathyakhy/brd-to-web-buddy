import { describe, it, expect, beforeEach } from "vitest";
import {
  registerChatToEventMapping,
  getCachedEventByChatId,
  hydrateChatToEventMap,
  areChatIdsEquivalent,
} from "@/lib/telegramChatMap";

describe("Telegram Chat to Event ID Cached Map Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves event mappings in O(1) time with prefix tolerance", () => {
    registerChatToEventMapping("-5128023564", {
      eventId: "ev-001-tesing",
      eventTitle: "Tesing Wedding",
      slug: "tesing-wedding",
      eventDate: "2026-10-01",
      guests: [{ name: "Mike", rsvp_status: "yes", party_size: 2 }],
    });

    registerChatToEventMapping("-5545734539", {
      eventId: "ev-002-testing2",
      eventTitle: "Testing2 Event",
      slug: "testing-2",
      eventDate: "2026-11-05",
      guests: [{ name: "test123", rsvp_status: "yes", party_size: 3 }],
    });

    // 1. Direct retrieval
    const ev1 = getCachedEventByChatId("-5128023564");
    expect(ev1).not.toBeNull();
    expect(ev1?.eventId).toBe("ev-001-tesing");
    expect(ev1?.eventTitle).toBe("Tesing Wedding");

    const ev2 = getCachedEventByChatId("-5545734539");
    expect(ev2).not.toBeNull();
    expect(ev2?.eventId).toBe("ev-002-testing2");
    expect(ev2?.eventTitle).toBe("Testing2 Event");

    // 2. Prefix-tolerant retrieval (-100 prefix added by Telegram supergroups)
    const ev1Prefixed = getCachedEventByChatId("-1005128023564");
    expect(ev1Prefixed).not.toBeNull();
    expect(ev1Prefixed?.eventId).toBe("ev-001-tesing");

    const ev2Prefixed = getCachedEventByChatId("-1005545734539");
    expect(ev2Prefixed).not.toBeNull();
    expect(ev2Prefixed?.eventId).toBe("ev-002-testing2");

    // 3. Strict isolation (Chat A must never return Event B)
    expect(areChatIdsEquivalent("-5128023564", "-5545734539")).toBe(false);
  });

  it("persists and hydrates cached mappings across localStorage and browser tabs", () => {
    registerChatToEventMapping("-5568784428", {
      eventId: "ev-003-gala",
      eventTitle: "Corporate Gala",
      slug: "corporate-gala",
    });

    // Rehydrate as if in a new tab
    hydrateChatToEventMap();

    const ev3 = getCachedEventByChatId("-5568784428");
    expect(ev3).not.toBeNull();
    expect(ev3?.eventId).toBe("ev-003-gala");
    expect(ev3?.eventTitle).toBe("Corporate Gala");
  });
});
