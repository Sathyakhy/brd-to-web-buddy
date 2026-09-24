export type FontOption = {
  value: string;
  label: string;
  sample: string;
  category: "khmer" | "latin" | "universal";
};

export const HEADER_FONT_OPTIONS: FontOption[] = [
  { value: "Khmer OS Moul", label: "Khmer OS Moul (Default Classic)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Moul", label: "Moul (Google Fonts)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Moulpali", label: "Moulpali (Rounded Regal)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Koulen", label: "Koulen (Bold Modern Headline)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Bokor", label: "Bokor (Antique Stylized)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Angkor", label: "Angkor (Ancient Monumental)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Bayon", label: "Bayon (Majestic Monolithic)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Dangrek", label: "Dangrek (Contemporary Bold)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Preahvihear", label: "Preahvihear (Graceful Tall)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Chenla", label: "Chenla (Classic Script)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Fasthand", label: "Fasthand (Artistic Cursive)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Noto Serif Khmer", label: "Noto Serif Khmer (Formal & Royal)", sample: "សិរីសួស្តី អាពាហ៍ពិពាហ៍", category: "khmer" },
  { value: "Cinzel", label: "Cinzel (English Roman Royal)", sample: "Wedding Invitation", category: "latin" },
  { value: "Playfair Display", label: "Playfair Display (Luxury Editorial)", sample: "Wedding Invitation", category: "latin" },
  { value: "Great Vibes", label: "Great Vibes (Calligraphy Script)", sample: "Wedding Invitation", category: "latin" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Graceful Serif)", sample: "Wedding Invitation", category: "latin" },
  { value: "Bitter", label: "Bitter (Contemporary Slab Serif)", sample: "Wedding Invitation", category: "latin" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Modern Geometric)", sample: "Wedding Invitation", category: "latin" },
];

export const BODY_FONT_OPTIONS: FontOption[] = [
  { value: "Siemreap", label: "Siemreap (Default Traditional)", sample: "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ", category: "khmer" },
  { value: "Battambang", label: "Battambang (Clean & Ultra-Legible)", sample: "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ", category: "khmer" },
  { value: "Kantumruy Pro", label: "Kantumruy Pro (Modern Khmer Body)", sample: "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ", category: "khmer" },
  { value: "Noto Serif Khmer", label: "Noto Serif Khmer (Formal Book Serif)", sample: "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ", category: "khmer" },
  { value: "Preahvihear", label: "Preahvihear (Graceful Khmer Sans)", sample: "សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ", category: "khmer" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Modern Clean)", sample: "Cordially invite you to celebrate with us", category: "latin" },
  { value: "Inter", label: "Inter (Neutral UI)", sample: "Cordially invite you to celebrate with us", category: "latin" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Elegant Serif)", sample: "Cordially invite you to celebrate with us", category: "latin" },
  { value: "Playfair Display", label: "Playfair Display (Editorial Serif)", sample: "Cordially invite you to celebrate with us", category: "latin" },
  { value: "Space Grotesk", label: "Space Grotesk (Tech Modern)", sample: "Cordially invite you to celebrate with us", category: "latin" },
];

export function resolveHeaderFont(
  fontName?: string | null,
  isEn: boolean = false
): string {
  const custom = fontName && fontName.trim() ? fontName.trim() : null;
  if (custom) {
    return `"${custom}", "Khmer OS Moul", "Moul", "Cinzel", "Playfair Display", serif`;
  }
  return isEn
    ? '"Cinzel", "Playfair Display", "Times New Roman", serif'
    : '"Khmer OS Moul", "Moul", serif';
}

export function resolveBodyFont(
  fontName?: string | null,
  isEn: boolean = false
): string {
  const custom = fontName && fontName.trim() ? fontName.trim() : null;
  if (custom) {
    return `"${custom}", "Siemreap", "Battambang", "Plus Jakarta Sans", sans-serif`;
  }
  return isEn
    ? '"Plus Jakarta Sans", "Inter", "Battambang", sans-serif'
    : '"Siemreap", "Battambang", sans-serif';
}
