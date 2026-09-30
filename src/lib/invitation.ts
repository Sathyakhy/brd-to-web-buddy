/**
 * Generates a cryptographically secure URL-safe token.
 * Uses Web Crypto API.
 */
export function generateToken(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // Convert to URL-safe base64
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const KHMER_DIGITS = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];
const KHMER_WEEKDAYS_LOCAL = ["អាទិត្យ","ច័ន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const KHMER_MONTHS_LOCAL = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];
const toKhmerNum = (n: number) => String(n).split("").map(d => KHMER_DIGITS[+d] ?? d).join("");

export function formatKhmerDateLocal(d: string | null | undefined) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `ថ្ងៃ${KHMER_WEEKDAYS_LOCAL[dt.getDay()]} ទី${toKhmerNum(dt.getDate())} ខែ${KHMER_MONTHS_LOCAL[dt.getMonth()]} ឆ្នាំ${toKhmerNum(dt.getFullYear())}`;
}
