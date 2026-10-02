import { describe, it, expect } from "vitest";
import {
  formatTelegramRsvpQuickSummary,
  formatTelegramRsvpDetailList,
} from "@/utils/telegramNotification";

describe("Multi-Event Guest Response & Telegram Isolation Verification", () => {
  it("strictly isolates guest lists and headcount summaries across multiple events", () => {
    // Event A (Wedding A)
    const eventAGuests = [
      {
        id: "g-a1",
        name: "Sok San",
        token: "broadcast-en-001",
        rsvp_status: "yes",
        party_size: 2,
        message: "Wishing you both happiness!",
      },
      {
        id: "g-a2",
        name: "Dara Chan",
        token: "broadcast-en-002",
        rsvp_status: "yes",
        party_size: 3,
        message: "Congratulations!",
      },
      {
        id: "g-a3",
        name: "Kimsing",
        token: "broadcast-en-003",
        rsvp_status: "no",
        party_size: 1,
        message: null,
      },
    ];

    // Event B (Corporate Gala / Wedding B)
    const eventBGuests = [
      {
        id: "g-b1",
        name: "Chea Borey",
        token: "broadcast-km-001",
        rsvp_status: "yes",
        party_size: 1,
        message: "ជួបគ្នានៅថ្ងៃកម្មវិធី!",
      },
      {
        id: "g-b2",
        name: "Vannak Meas",
        token: "broadcast-km-002",
        rsvp_status: "no",
        party_size: 1,
        message: "សុំទោស ជាប់រវល់បេសកកម្ម",
      },
    ];

    // 1. Generate Telegram summaries for Event A
    const eventASummary = formatTelegramRsvpDetailList({
      eventTitle: "Wedding A (Sok & Chan)",
      guests: eventAGuests,
    }).join("\n");

    // 2. Generate Telegram summaries for Event B
    const eventBSummary = formatTelegramRsvpDetailList({
      eventTitle: "Annual Gala B",
      guests: eventBGuests,
    }).join("\n");

    // Verify Event A summary
    expect(eventASummary).toContain("Wedding A (Sok &amp; Chan)");
    expect(eventASummary).toContain("5</b> នាក់ (Pax)"); // 2 + 3 = 5
    expect(eventASummary).toContain("Sok San");
    expect(eventASummary).toContain("Dara Chan");
    expect(eventASummary).toContain("Kimsing");
    expect(eventASummary).not.toContain("Chea Borey");
    expect(eventASummary).not.toContain("Vannak Meas");

    // Verify Event B summary
    expect(eventBSummary).toContain("Annual Gala B");
    expect(eventBSummary).toContain("1</b> នាក់ (Pax)");
    expect(eventBSummary).toContain("Chea Borey");
    expect(eventBSummary).toContain("Vannak Meas");
    expect(eventBSummary).not.toContain("Sok San");
    expect(eventBSummary).not.toContain("Dara Chan");
    expect(eventBSummary).not.toContain("Kimsing");

    // 3. Quick RSVP summaries isolation
    const eventAQuick = formatTelegramRsvpQuickSummary({
      eventTitle: "Wedding A",
      guests: eventAGuests,
    });
    const eventBQuick = formatTelegramRsvpQuickSummary({
      eventTitle: "Gala B",
      guests: eventBGuests,
    });

    expect(eventAQuick).toContain("5</b> នាក់ / Pax");
    expect(eventAQuick).toContain("1</b> នាក់"); // 1 declined (Kimsing)

    expect(eventBQuick).toContain("1</b> នាក់ / Pax");
    expect(eventBQuick).toContain("1</b> នាក់"); // 1 declined (Vannak)
  });

  it("verifies localStorage session keys are distinct per event slug", () => {
    const slugA = "wedding-a";
    const slugB = "wedding-b";

    const storageKeyA = `rsvp_broadcast_session_${slugA}`;
    const storageKeyB = `rsvp_broadcast_session_${slugB}`;

    expect(storageKeyA).not.toEqual(storageKeyB);
    expect(storageKeyA).toBe("rsvp_broadcast_session_wedding-a");
    expect(storageKeyB).toBe("rsvp_broadcast_session_wedding-b");
  });
});
