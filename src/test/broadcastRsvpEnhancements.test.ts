import { describe, it, expect } from "vitest";

describe("Broadcast RSVP Enhancements QA", () => {
  // Requirement 1: Saving distinct data for each broadcast guest so previous data is not overwritten
  describe("Multi-guest broadcast data allocation", () => {
    type GuestSlot = {
      id: string;
      name: string;
      token: string;
      rsvp_status: string;
      party_size: number;
      message: string | null;
      responded_at: string | null;
    };

    const allocateBroadcastSlot = (
      existingGuests: GuestSlot[],
      submittedName: string,
      status: "yes" | "no",
      partySize: number,
      message: string,
      language: "km" | "en"
    ): { updatedGuests: GuestSlot[]; assignedToken: string } => {
      // Find an available unassigned broadcast slot
      const unassigned = existingGuests.filter(
        g =>
          g.token.startsWith("broadcast-") &&
          g.rsvp_status === "pending" &&
          (!g.message || g.message.trim() === "") &&
          !g.responded_at
      );

      const langPrefix = `broadcast-${language}`;
      const slot =
        unassigned.find(g => g.token.startsWith(langPrefix) && g.token !== langPrefix) ||
        unassigned.find(g => g.token.startsWith("broadcast-") && g.token !== "broadcast-km" && g.token !== "broadcast-en") ||
        unassigned.find(g => g.token === langPrefix) ||
        unassigned[0];

      const assignedToken = slot ? slot.token : `broadcast-${language}`;
      const effectiveMsg = `[${submittedName}] ${message}`.trim();

      const updatedGuests = existingGuests.map(g => {
        if (g.token === assignedToken) {
          return {
            ...g,
            name: submittedName,
            rsvp_status: status,
            party_size: partySize,
            message: effectiveMsg,
            responded_at: new Date().toISOString(),
          };
        }
        return g;
      });

      return { updatedGuests, assignedToken };
    };

    it("allocates a distinct slot for guest 1 and does not overwrite guest 1 when guest 2 responds", () => {
      const initialPool: GuestSlot[] = [
        { id: "1", name: "Honored Guest (Broadcast Khmer)", token: "broadcast-km-01", rsvp_status: "pending", party_size: 1, message: null, responded_at: null },
        { id: "2", name: "Honored Guest (Broadcast Khmer)", token: "broadcast-km-02", rsvp_status: "pending", party_size: 1, message: null, responded_at: null },
      ];

      // Guest 1 responds: Sok San
      const r1 = allocateBroadcastSlot(initialPool, "Sok San", "yes", 2, "Congratulations!", "km");
      expect(r1.assignedToken).toBe("broadcast-km-01");

      const guest1InPool = r1.updatedGuests.find(g => g.token === "broadcast-km-01");
      expect(guest1InPool?.name).toBe("Sok San");
      expect(guest1InPool?.rsvp_status).toBe("yes");
      expect(guest1InPool?.party_size).toBe(2);

      // Guest 2 responds: Dara Chan
      const r2 = allocateBroadcastSlot(r1.updatedGuests, "Dara Chan", "no", 1, "Sorry cannot attend", "km");
      expect(r2.assignedToken).toBe("broadcast-km-02");

      const guest2InPool = r2.updatedGuests.find(g => g.token === "broadcast-km-02");
      expect(guest2InPool?.name).toBe("Dara Chan");
      expect(guest2InPool?.rsvp_status).toBe("no");

      // Verify Guest 1 was NOT overwritten!
      const guest1StillIntact = r2.updatedGuests.find(g => g.token === "broadcast-km-01");
      expect(guest1StillIntact?.name).toBe("Sok San");
      expect(guest1StillIntact?.rsvp_status).toBe("yes");
      expect(guest1StillIntact?.party_size).toBe(2);

      // Verify host can see counts for both:
      const attending = r2.updatedGuests.filter(g => g.rsvp_status === "yes").length;
      const declining = r2.updatedGuests.filter(g => g.rsvp_status === "no").length;
      expect(attending).toBe(1);
      expect(declining).toBe(1);
    });
  });

  // Requirement 2: Saving session on device so guest cannot accept again, but can edit previous response
  describe("Device session persistence and edit response", () => {
    it("recognizes existing device session and updates the previous response row using the same token", () => {
      // Mock localStorage session
      const savedSession = {
        token: "broadcast-km-01",
        name: "Sok San",
        status: "yes" as const,
        party_size: 2,
        message: "Best wishes!",
        responded_at: "2026-10-01T08:00:00.000Z",
      };

      // When Sok San edits party size from 2 to 3 and changes message:
      const editSubmission = (
        currentSession: typeof savedSession,
        newStatus: "yes" | "no",
        newPartySize: number,
        newMessage: string
      ) => {
        // Re-use saved token!
        return {
          ...currentSession,
          status: newStatus,
          party_size: newPartySize,
          message: newMessage,
          responded_at: new Date().toISOString(),
        };
      };

      const updatedSession = editSubmission(savedSession, "yes", 3, "Updated: We will be 3 guests!");
      expect(updatedSession.token).toBe("broadcast-km-01"); // Token remained the same!
      expect(updatedSession.party_size).toBe(3);
      expect(updatedSession.message).toBe("Updated: We will be 3 guests!");
    });
  });

  // Requirement 3: Same guest name confirmation
  describe("Duplicate guest name detection", () => {
    type GuestRecord = {
      id: string;
      name: string;
      token: string;
      rsvp_status: string;
      message: string | null;
    };

    const findDuplicateGuest = (
      guests: GuestRecord[],
      submittedName: string
    ): GuestRecord | null => {
      const responded = guests.filter(g => g.rsvp_status === "yes" || g.rsvp_status === "no");
      const normalized = submittedName.trim().toLowerCase();
      const match = responded.find(g => {
        const direct = g.name && g.name.trim().toLowerCase() === normalized;
        const inMsg =
          g.message &&
          (g.message.startsWith(`[${submittedName.trim()}]`) ||
            g.message.toLowerCase().startsWith(`[${normalized}]`));
        return direct || inMsg;
      });
      return match || null;
    };

    it("detects when a guest with the exact same name has already responded", () => {
      const existing: GuestRecord[] = [
        { id: "1", name: "Sok San", token: "tok-1", rsvp_status: "yes", message: "[Sok San] See you there!" },
        { id: "2", name: "Honored Guest", token: "tok-2", rsvp_status: "pending", message: null },
      ];

      const match = findDuplicateGuest(existing, "Sok San");
      expect(match).not.toBeNull();
      expect(match?.name).toBe("Sok San");
      expect(match?.token).toBe("tok-1");
    });

    it("detects case-insensitive matching and name stored in message tag", () => {
      const existing: GuestRecord[] = [
        { id: "1", name: "Honored Guest (Broadcast Khmer)", token: "broadcast-km-01", rsvp_status: "yes", message: "[Chantrea] Congratulations!" },
      ];

      const match = findDuplicateGuest(existing, "chantrea");
      expect(match).not.toBeNull();
      expect(match?.token).toBe("broadcast-km-01");
    });

    it("returns null when no matching responded guest exists", () => {
      const existing: GuestRecord[] = [
        { id: "1", name: "Sok San", token: "tok-1", rsvp_status: "yes", message: "Congratulations" },
      ];

      const match = findDuplicateGuest(existing, "Vireak Bot");
      expect(match).toBeNull();
    });
  });

  // Admin & Customer views: Accurate headcount and unassigned slot filtering
  describe("Admin and Customer Guest Visibility & Stats Calculation", () => {
    type Guest = {
      id: string;
      name: string;
      token: string;
      rsvp_status: string;
      party_size: number;
      message: string | null;
      responded_at: string | null;
    };

    const isUnassignedBroadcastSlot = (g: Guest) =>
      Boolean(
        g.token?.startsWith("broadcast-") &&
          g.rsvp_status === "pending" &&
          !g.responded_at &&
          (!g.message || !g.message.trim())
      );

    it("filters out empty unassigned pool slots so pending count and guest table are not inflated", () => {
      const guests: Guest[] = [
        // Real named guest
        { id: "1", name: "Mr. Pich & Family", token: "g-pich-km", rsvp_status: "pending", party_size: 2, message: null, responded_at: null },
        // Broadcast respondent 1
        { id: "2", name: "Sok San", token: "broadcast-km-01", rsvp_status: "yes", party_size: 2, message: "[Sok San] Warm wishes", responded_at: "2026-10-01" },
        // Broadcast respondent 2
        { id: "3", name: "Dara Chan", token: "broadcast-km-02", rsvp_status: "no", party_size: 1, message: "[Dara Chan] Apologies", responded_at: "2026-10-01" },
        // Unassigned empty broadcast pool slots
        { id: "4", name: "Honored Guest (Broadcast Khmer)", token: "broadcast-km-03", rsvp_status: "pending", party_size: 1, message: null, responded_at: null },
        { id: "5", name: "Honored Guest (Broadcast Khmer)", token: "broadcast-km-04", rsvp_status: "pending", party_size: 1, message: null, responded_at: null },
      ];

      const visibleGuests = guests.filter(g => !isUnassignedBroadcastSlot(g));

      // Only 3 visible guests (1 named + 2 broadcast respondents)
      expect(visibleGuests.length).toBe(3);

      const stats = {
        total: visibleGuests.length,
        yes: visibleGuests.filter(g => g.rsvp_status === "yes").length,
        no: visibleGuests.filter(g => g.rsvp_status === "no").length,
        pending: visibleGuests.filter(g => g.rsvp_status === "pending").length,
        headcount: visibleGuests.filter(g => g.rsvp_status === "yes").reduce((sum, g) => sum + g.party_size, 0),
      };

      expect(stats.total).toBe(3);
      expect(stats.yes).toBe(1);
      expect(stats.no).toBe(1);
      expect(stats.pending).toBe(1); // Only the actual named guest, not empty pool slots!
      expect(stats.headcount).toBe(2);
    });
  });
});
