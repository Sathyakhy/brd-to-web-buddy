import { describe, it, expect } from "vitest";
import { getResolvedCoverTitleStyle } from "../lib/coverInvitationStyle";
import { getResolvedGuestNameStyle } from "../lib/guestNameStyle";

describe("Token Language & Resolution QA", () => {
  const resolveTokenLang = (rawTok: string): "en" | "km" | null => {
    const tokenLower = rawTok.toLowerCase().trim();
    if (
      tokenLower.endsWith("-en") ||
      tokenLower === "en" ||
      tokenLower === "broadcast-en" ||
      tokenLower === "open-en"
    ) {
      return "en";
    }
    if (
      tokenLower.endsWith("-km") ||
      tokenLower.endsWith("-kh") ||
      tokenLower === "km" ||
      tokenLower === "kh" ||
      tokenLower === "broadcast-km" ||
      tokenLower === "open-km"
    ) {
      return "km";
    }
    return null;
  };

  it("accurately detects English tokens without requiring URL query redirects", () => {
    expect(resolveTokenLang("broadcast-en")).toBe("en");
    expect(resolveTokenLang("open-en")).toBe("en");
    expect(resolveTokenLang("en")).toBe("en");
    expect(resolveTokenLang("g-guest123-en")).toBe("en");
    expect(resolveTokenLang("xyz987-EN")).toBe("en");
  });

  it("accurately detects Khmer tokens", () => {
    expect(resolveTokenLang("broadcast-km")).toBe("km");
    expect(resolveTokenLang("open-km")).toBe("km");
    expect(resolveTokenLang("km")).toBe("km");
    expect(resolveTokenLang("kh")).toBe("km");
    expect(resolveTokenLang("g-guest123-km")).toBe("km");
  });

  it("strips language suffix to find base token for database matching", () => {
    const stripLangSuffix = (token: string) => token.replace(/-(en|km|kh)$/i, "");
    expect(stripLangSuffix("g-guest123-en")).toBe("g-guest123");
    expect(stripLangSuffix("g-guest123-km")).toBe("g-guest123");
    expect(stripLangSuffix("broadcast-en")).toBe("broadcast");
    expect(stripLangSuffix("broadcast-km")).toBe("broadcast");
    expect(stripLangSuffix("plainToken")).toBe("plainToken");
  });
});

describe("Broadcast Invitation English Message Cleanliness QA", () => {
  const hasKhmer = (s: string) => /[\u1780-\u17ff\u19e0-\u19ff]/.test(s);
  const cleanName = (raw?: string | null) => {
    if (!raw) return "";
    const lines = raw.split(/\r?\n|\s\/\s/).map(s => s.trim()).filter(Boolean);
    const target = lines.length >= 3 ? lines[2] : (lines.length === 1 ? lines[0] : (lines[lines.length - 1] || ""));
    const parts = target.split("|").map(s => s.trim()).filter(Boolean);
    return parts.join(" ").trim();
  };

  const resolveCoupleEn = (opts: {
    groomName?: string | null;
    brideName?: string | null;
    groomNameEn?: string | null;
    brideNameEn?: string | null;
    titleEn?: string | null;
  }) => {
    const groomKh = cleanName(opts.groomName) || "<Groom's Name>";
    const brideKh = cleanName(opts.brideName) || "<Bride's Name>";
    const groomEng = cleanName(opts.groomNameEn) || (!hasKhmer(groomKh) ? groomKh : "");
    const brideEng = cleanName(opts.brideNameEn) || (!hasKhmer(brideKh) ? brideKh : "");

    return (groomEng && brideEng)
      ? `${groomEng} & ${brideEng}`
      : (opts.titleEn?.trim() || "the Bride & Groom");
  };

  it("prevents Khmer characters from leaking into English message when English names not provided", () => {
    const couple = resolveCoupleEn({
      groomName: "កូនប្រុសនាម\nសុខ វិបុល",
      brideName: "កូនស្រីនាម\nគង់ សុជាតា",
      groomNameEn: null,
      brideNameEn: null,
      titleEn: "Wedding of Vibul & Cheata",
    });
    expect(couple).toBe("Wedding of Vibul & Cheata");
    expect(hasKhmer(couple)).toBe(false);
  });

  it("uses English groom and bride names when provided", () => {
    const couple = resolveCoupleEn({
      groomName: "សុខ វិបុល",
      brideName: "គង់ សុជាតា",
      groomNameEn: "Vibul Sok",
      brideNameEn: "Cheata Kong",
      titleEn: "Wedding",
    });
    expect(couple).toBe("Vibul Sok & Cheata Kong");
    expect(hasKhmer(couple)).toBe(false);
  });

  it("gracefully falls back to 'the Bride & Groom' if no English names or title provided", () => {
    const couple = resolveCoupleEn({
      groomName: "សុខ វិបុល",
      brideName: "គង់ សុជាតា",
      groomNameEn: null,
      brideNameEn: null,
      titleEn: null,
    });
    expect(couple).toBe("the Bride & Groom");
    expect(hasKhmer(couple)).toBe(false);
  });
});

describe("Cover Invitation Titles & Wording QA", () => {
  it("resolves English cover title to INVITATION", () => {
    const enStyle = getResolvedCoverTitleStyle(null, true, "#d68a0c");
    expect(enStyle.text).toBe("INVITATION");
  });

  it("resolves Khmer cover title to សូមគោរពអញ្ជើញ", () => {
    const kmStyle = getResolvedCoverTitleStyle(null, false, "#d68a0c");
    expect(kmStyle.text).toBe("សូមគោរពអញ្ជើញ");
  });
});
