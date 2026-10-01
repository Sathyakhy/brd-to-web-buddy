import { describe, it, expect } from "vitest";
import {
  extractGuestNameAndWishes,
  formatTelegramRsvpQuickSummary,
  formatTelegramRsvpDetailList,
} from "@/utils/telegramNotification";
import { getDualLanguageConfig, resolveEventContent } from "@/lib/dualLanguage";
import { normalizeMusicSettings } from "@/lib/musicSettings";
import { normalizeEnvelopeConfig } from "@/lib/envelopeUnboxing";

describe("Comprehensive Invitation System QA Suite", () => {
  describe("1. Dual-Language & Localized Content Resolution", () => {
    const mockEvent: any = {
      title: "សិរីមង្គលអាពាហ៍ពិពាហ៍",
      groom_name: "គុនសុង",
      bride_name: "គីមស៊ីង",
      location_name: "សណ្ឋាគារ ហ្គាឌិន ស៊ីធី",
      section_visibility: {
        dual_language: {
          enabled: true,
          default_language: "km",
          en: {
            title: "Wedding Celebration",
            groom_name: "Kunsong",
            bride_name: "Kimsing",
            venue: "Garden City Hotel",
          },
        },
      },
    };

    it("should accurately resolve Khmer fields by default", () => {
      const cfg = getDualLanguageConfig(mockEvent.section_visibility.dual_language, mockEvent);
      expect(cfg.enabled).toBe(true);
      expect(cfg.default_language).toBe("km");

      const resolvedKm = resolveEventContent(mockEvent, "km", cfg);
      expect(resolvedKm.title).toBe("សិរីមង្គលអាពាហ៍ពិពាហ៍");
      expect(resolvedKm.groom_name).toBe("គុនសុង");
    });

    it("should accurately resolve English overrides when language is 'en'", () => {
      const cfg = getDualLanguageConfig(mockEvent.section_visibility.dual_language, mockEvent);
      const resolvedEn = resolveEventContent(mockEvent, "en", cfg);
      expect(resolvedEn.title).toBe("Wedding Celebration");
      expect(resolvedEn.groom_name).toBe("Kunsong");
      expect(resolvedEn.venue).toBe("Garden City Hotel");
    });
  });

  describe("2. Broadcast Token & Guest Name Resolution", () => {
    it("should accurately parse bracketed names and wishes", () => {
      const g = {
        name: "Honored Guest (Broadcast English)",
        token: "broadcast-en-001",
        message: "[Mike Kang and Wife] Wishing you both a lifetime of happiness!",
      };
      const { name, wishes } = extractGuestNameAndWishes(g);
      expect(name).toBe("Mike Kang and Wife");
      expect(wishes).toBe("Wishing you both a lifetime of happiness!");
    });

    it("should handle plain text wishes without brackets", () => {
      const g = {
        name: "Srunpitu Heng",
        token: "broadcast-en-srunpitu-heng",
        message: "Congratulations to the lovely couple!",
      };
      const { name, wishes } = extractGuestNameAndWishes(g);
      expect(name).toBe("Srunpitu Heng");
      expect(wishes).toBe("Congratulations to the lovely couple!");
    });
  });

  describe("3. Telegram Notification Formatting & Deduplication QA", () => {
    const sampleGuests = [
      {
        id: "1",
        name: "Emma and Orn",
        party_size: 2,
        rsvp_status: "yes",
        message: "Congratulations to this wonderful lovebirds!",
      },
      {
        id: "2",
        name: "Mike Kang and Wife",
        party_size: 2,
        rsvp_status: "yes",
        message: "Congratulations 🍾",
      },
      {
        id: "3",
        name: "Srunpitu Heng",
        party_size: 2,
        rsvp_status: "yes",
        message: "Wishing you both all the best.",
      },
      {
        id: "4",
        name: "Yi ping",
        party_size: 1,
        rsvp_status: "yes",
        message: "",
      },
      {
        id: "5",
        name: "Ms Sao Sovannaroth",
        party_size: 1,
        rsvp_status: "yes",
        message: null,
      },
      {
        id: "6",
        name: "Khy Chansathya",
        party_size: 2,
        rsvp_status: "yes",
        message: "Wishing you a life full of love.",
      },
      {
        id: "7",
        name: "Young An Or",
        party_size: 2,
        rsvp_status: "yes",
        message: "",
      },
      // Duplicate artifact that should be filtered out
      {
        id: "8",
        token: "broadcast-en",
        name: "Honored Guest (Broadcast English)",
        party_size: 1,
        rsvp_status: "pending",
        message: null,
      },
      // Unassigned broadcast pool slot
      {
        id: "9",
        token: "broadcast-km-005",
        name: "ភ្ញៀវកិត្តិយស (Broadcast Khmer)",
        party_size: 1,
        rsvp_status: "pending",
        message: null,
      },
    ];

    it("should compute exact attending count (7 groups) and total headcount (12 pax)", () => {
      const summary = formatTelegramRsvpQuickSummary({
        eventTitle: "Wedding Celebration",
        eventDate: "2026-11-16",
        guests: sampleGuests,
      });

      expect(summary).toContain("12"); // Total Pax
      expect(summary).toContain("7"); // Attending groups
      expect(summary).toContain("Wedding Celebration");
    });

    it("should generate clean, deduplicated detailed breakdown in /summary", () => {
      const detailMessages = formatTelegramRsvpDetailList({
        eventTitle: "Wedding Celebration",
        eventDate: "2026-11-16",
        guests: sampleGuests,
      });

      const fullOutput = detailMessages.join("\n");
      expect(fullOutput).toContain("Emma and Orn");
      expect(fullOutput).toContain("Mike Kang and Wife");
      expect(fullOutput).toContain("Srunpitu Heng");
      expect(fullOutput).toContain("Yi ping");
      expect(fullOutput).toContain("Ms Sao Sovannaroth");
      expect(fullOutput).toContain("Khy Chansathya");
      expect(fullOutput).toContain("Young An Or");
      expect(fullOutput).not.toContain("Broadcast English");
      expect(fullOutput).not.toContain("Broadcast Khmer");
    });
  });

  describe("4. Audio & Music Autoplay Configuration", () => {
    it("should properly normalize both cover and invitation music flags", () => {
      const cfg = normalizeMusicSettings({
        music_autoplay_mode: "both",
        autoPlayCover: true,
        autoPlayInvitation: true,
      });
      expect(cfg.autoPlayCover).toBe(true);
      expect(cfg.autoPlayInvitation).toBe(true);
    });

    it("should respect cover-only music mode", () => {
      const cfg = normalizeMusicSettings({
        music_autoplay_mode: "cover_only",
      });
      expect(cfg.autoPlayCover).toBe(true);
      expect(cfg.autoPlayInvitation).toBe(false);
    });
  });

  describe("5. 3D Envelope Unboxing Configuration", () => {
    it("should normalize gatefold envelope settings", () => {
      const env = normalizeEnvelopeConfig({
        enabled: true,
        style: "royal-gatefold",
        speed: "custom",
        custom_duration_sec: 4,
      });
      expect(env.enabled).toBe(true);
      expect(env.style).toBe("royal-gatefold");
      expect(env.custom_duration_sec).toBe(4);
    });
  });
});
