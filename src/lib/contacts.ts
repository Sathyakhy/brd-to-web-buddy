import {
  Phone, Send, MessageCircle, Mail, Link as LinkIcon, MessageSquare,
} from "lucide-react";

export type ContactType = "phone" | "telegram" | "whatsapp" | "messenger" | "email" | "url";

export type ContactItem = {
  id: string;
  label: string;        // e.g. "Smart", "Father of the bride"
  label_km?: string;
  label_en?: string;
  type: ContactType;
  value: string;        // raw value (number, username, url, email)
};

export const CONTACT_TYPES: { value: ContactType; label: string; placeholder: string }[] = [
  { value: "phone",     label: "Phone",     placeholder: "+855 12 345 678" },
  { value: "telegram",  label: "Telegram",  placeholder: "@username or https://t.me/username" },
  { value: "whatsapp",  label: "WhatsApp",  placeholder: "+855 12 345 678" },
  { value: "messenger", label: "Messenger", placeholder: "username or https://m.me/username" },
  { value: "email",     label: "Email",     placeholder: "host@example.com" },
  { value: "url",       label: "Website",   placeholder: "https://…" },
];

export function getContactIcon(type: ContactType) {
  switch (type) {
    case "phone":     return Phone;
    case "telegram":  return Send;
    case "whatsapp":  return MessageCircle;
    case "messenger": return MessageSquare;
    case "email":     return Mail;
    case "url":       return LinkIcon;
  }
}

export function getContactColor(type: ContactType) {
  switch (type) {
    case "phone":     return "#25D366";
    case "telegram":  return "#2AABEE";
    case "whatsapp":  return "#25D366";
    case "messenger": return "#0084FF";
    case "email":     return "#db9b0f";
    case "url":       return "#6a4b00";
  }
}

/** Build a clickable href for a contact entry. */
export function getContactHref(c: ContactItem): string {
  const v = (c.value ?? "").trim();
  if (!v) return "#";
  switch (c.type) {
    case "phone":
      return `tel:${v.replace(/[^\d+]/g, "")}`;
    case "whatsapp":
      return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
    case "telegram":
      if (v.startsWith("http")) return v;
      return `https://t.me/${v.replace(/^@/, "")}`;
    case "messenger":
      if (v.startsWith("http")) return v;
      return `https://m.me/${v.replace(/^@/, "")}`;
    case "email":
      return `mailto:${v}`;
    case "url":
      return v.startsWith("http") ? v : `https://${v}`;
  }
}

export function uidContact() {
  return Math.random().toString(36).slice(2, 10);
}

export function normalizeContacts(raw: unknown): ContactItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: any) => {
      if (!c || typeof c !== "object") return null;
      const type = (c.type ?? "phone") as ContactType;
      if (!CONTACT_TYPES.some((t) => t.value === type)) return null;
      return {
        id: String(c.id ?? uidContact()),
        label: String(c.label ?? ""),
        type,
        value: String(c.value ?? ""),
      } as ContactItem;
    })
    .filter(Boolean) as ContactItem[];
}

/** Migrate the legacy `contact_phone` text field into a structured list. */
export function buildLegacyContacts(contact_phone?: string | null): ContactItem[] {
  if (!contact_phone) return [];
  return contact_phone
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value) => {
      // Try to split "Label - +855 12 ..." or "+855 12 ... | Label"
      const sep = /\s*[|\-–—]\s*/;
      const parts = value.split(sep);
      let label = "";
      let phone = value;
      if (parts.length === 2) {
        // Heuristic: whichever side has digits is the phone
        const leftDigits = (parts[0].match(/\d/g) || []).length;
        const rightDigits = (parts[1].match(/\d/g) || []).length;
        if (rightDigits > leftDigits) { label = parts[0]; phone = parts[1]; }
        else { label = parts[1]; phone = parts[0]; }
      }
      return {
        id: uidContact(),
        label: label.trim(),
        type: "phone" as ContactType,
        value: phone.trim(),
      };
    });
}
