/**
 * Dual Language support for wedding and event invitations.
 * Allows switching between Khmer (km) and English (en) versions.
 */

import { TemplateData } from "@/components/templates/InvitationTemplate";

export type LanguageCode = "km" | "en";

export type LanguageContent = {
  title?: string | null;
  cover_message?: string | null;
  countdown_message?: string | null;
  description?: string | null;
  venue?: string | null;
  bride_name?: string | null;
  groom_name?: string | null;
  ceremony_time?: string | null;
  reception_time?: string | null;
  dress_code?: string | null;
  qr_code_message?: string | null;
  qr_account_name?: string | null;
  apologies_message?: string | null;
  thank_you_message?: string | null;
};

export type DualLanguageConfig = {
  enabled: boolean;
  default_language?: LanguageCode;
  km: LanguageContent;
  en: LanguageContent;
};

export type TemplateTranslations = {
  openInvitation: string;
  cordiallyInvites: string;
  honoredGuest: string;
  weddingInvitation: string;
  parentsTitle: string;
  groomsParents: string;
  bridesParents: string;
  father: string;
  mother: string;
  eventDate: string;
  venueTitle: string;
  dressCodeTitle: string;
  viewMap: string;
  ceremonyTitle: string;
  receptionTitle: string;
  countdownTitle: string;
  daysRemaining: string;
  hours: string;
  minutes: string;
  seconds: string;
  agendaTitle: string;
  galleryTitle: string;
  qrGiftTitle: string;
  scanQrPrompt: string;
  apologiesTitle: string;
  thankYouTitle: string;
  locationTitle: string;
  rsvpTitle: string;
  rsvpAttending: string;
  rsvpDeclining: string;
  rsvpPending: string;
  partySize: string;
  wishesPlaceholder: string;
  submitRsvp: string;
  contactHosts: string;
  footerThankYou: string;
};

export const KM_TRANSLATIONS: TemplateTranslations = {
  openInvitation: "បើកធៀប",
  cordiallyInvites: "សូមគោរពអញ្ជើញ",
  honoredGuest: "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា",
  weddingInvitation: "លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍",
  parentsTitle: "មាតាបិតាទាំងសងខាង",
  groomsParents: "ខាងកូនកំលោះ",
  bridesParents: "ខាងកូនក្រមុំ",
  father: "ឪពុក",
  mother: "ម្តាយ",
  eventDate: "កាលបរិច្ឆេទ",
  venueTitle: "ទីតាំងប្រារព្ធពិធី",
  dressCodeTitle: "សម្លៀកបំពាក់",
  viewMap: "មើលទីតាំងលើផែនទី",
  ceremonyTitle: "ពិធីសំពះផ្ទឹម",
  receptionTitle: "ពិធីពិសាភោជនាហារ",
  countdownTitle: "រាប់ថយក្រោយ",
  daysRemaining: "ថ្ងៃទៀត",
  hours: "ម៉ោង",
  minutes: "នាទី",
  seconds: "វិនាទី",
  agendaTitle: "កម្មវិធីមង្គលការ",
  galleryTitle: "កម្រងរូបភាព",
  qrGiftTitle: "ចំណងដៃអាពាហ៍ពិពាហ៍",
  scanQrPrompt: "ស្កេនដើម្បីផ្ញើចំណងដៃតាមគណនីធនាគារ",
  apologiesTitle: "លិខិតសូមអភ័យទោស",
  thankYouTitle: "លិខិតថ្លែងអំណរគុណ",
  locationTitle: "ទីតាំងកម្មវិធី",
  rsvpTitle: "ឆ្លើយតបការចូលរួម",
  rsvpAttending: "នឹងចូលរួម",
  rsvpDeclining: "សុំទោស មិនអាចចូលរួមបាន",
  rsvpPending: "កំពុងរង់ចាំការឆ្លើយតប",
  partySize: "ចំនួនភ្ញៀវ",
  wishesPlaceholder: "សូមសរសេរសារជូនពរនៅទីនេះ...",
  submitRsvp: "ផ្ញើការឆ្លើយតប",
  contactHosts: "ទំនាក់ទំនងម្ចាស់កម្មវិធី",
  footerThankYou: "សូមអរគុណយ៉ាងជ្រាលជ្រៅចំពោះវត្តមានដ៏ឧត្តុង្គឧត្តម",
};

export const EN_TRANSLATIONS: TemplateTranslations = {
  openInvitation: "Open Invitation",
  cordiallyInvites: "Cordially Invites You",
  honoredGuest: "Distinguished Guests, Family & Friends",
  weddingInvitation: "Wedding Invitation",
  parentsTitle: "Our Beloved Parents",
  groomsParents: "Groom's Parents",
  bridesParents: "Bride's Parents",
  father: "Father",
  mother: "Mother",
  eventDate: "Date & Time",
  venueTitle: "Venue & Location",
  dressCodeTitle: "Dress Code",
  viewMap: "View on Google Maps",
  ceremonyTitle: "Wedding Ceremony",
  receptionTitle: "Banquet & Reception",
  countdownTitle: "Countdown",
  daysRemaining: "Days to go",
  hours: "Hours",
  minutes: "Mins",
  seconds: "Secs",
  agendaTitle: "Wedding Program",
  galleryTitle: "Photo Gallery",
  qrGiftTitle: "Wedding Gift · Bank Transfer",
  scanQrPrompt: "Scan QR code to transfer wedding gift via mobile banking",
  apologiesTitle: "Letter of Apology",
  thankYouTitle: "Letter of Gratitude",
  locationTitle: "Event Location",
  rsvpTitle: "R. S. V. P.",
  rsvpAttending: "Joyfully Accepts",
  rsvpDeclining: "Regretfully Declines",
  rsvpPending: "Awaiting Response",
  partySize: "Number of Guests",
  wishesPlaceholder: "Write your warm wishes for the couple...",
  submitRsvp: "Confirm RSVP",
  contactHosts: "Contact Hosts",
  footerThankYou: "Thank you for sharing in our joy and celebrating our special day.",
};

export function getTranslations(lang: LanguageCode): TemplateTranslations {
  return lang === "en" ? EN_TRANSLATIONS : KM_TRANSLATIONS;
}

/**
 * Extract dual language configuration from section_visibility or raw object.
 */
export function getDualLanguageConfig(raw: unknown, baseEvent?: any): DualLanguageConfig {
  const obj = (raw && typeof raw === "object") ? (raw as Record<string, any>) : {};
  const dualObj = (obj.dual_language && typeof obj.dual_language === "object")
    ? obj.dual_language
    : (obj.dual_language_config && typeof obj.dual_language_config === "object")
    ? obj.dual_language_config
    : {};

  const enabled = Boolean(
    obj.dual_language_enabled ??
    dualObj.enabled ??
    obj.enabled ??
    false
  );

  const default_language: LanguageCode = (
    obj.default_language ??
    dualObj.default_language ??
    "km"
  ) === "en" ? "en" : "km";

  const km: LanguageContent = {
    title: obj.km_content?.title ?? dualObj.km?.title ?? obj.km?.title ?? baseEvent?.title ?? null,
    cover_message: obj.km_content?.cover_message ?? dualObj.km?.cover_message ?? obj.km?.cover_message ?? baseEvent?.cover_message ?? null,
    countdown_message: obj.km_content?.countdown_message ?? dualObj.km?.countdown_message ?? obj.km?.countdown_message ?? baseEvent?.countdown_message ?? null,
    description: obj.km_content?.description ?? dualObj.km?.description ?? obj.km?.description ?? baseEvent?.description ?? null,
    venue: obj.km_content?.venue ?? dualObj.km?.venue ?? obj.km?.venue ?? baseEvent?.venue ?? null,
    bride_name: obj.km_content?.bride_name ?? dualObj.km?.bride_name ?? obj.km?.bride_name ?? baseEvent?.bride_name ?? null,
    groom_name: obj.km_content?.groom_name ?? dualObj.km?.groom_name ?? obj.km?.groom_name ?? baseEvent?.groom_name ?? null,
    ceremony_time: obj.km_content?.ceremony_time ?? dualObj.km?.ceremony_time ?? obj.km?.ceremony_time ?? baseEvent?.ceremony_time ?? null,
    reception_time: obj.km_content?.reception_time ?? dualObj.km?.reception_time ?? obj.km?.reception_time ?? baseEvent?.reception_time ?? null,
    dress_code: obj.km_content?.dress_code ?? dualObj.km?.dress_code ?? obj.km?.dress_code ?? baseEvent?.dress_code ?? null,
    qr_code_message: obj.km_content?.qr_code_message ?? dualObj.km?.qr_code_message ?? obj.km?.qr_code_message ?? baseEvent?.qr_code_message ?? null,
    qr_account_name: obj.km_content?.qr_account_name ?? dualObj.km?.qr_account_name ?? obj.km?.qr_account_name ?? baseEvent?.qr_account_name ?? null,
    apologies_message: obj.km_content?.apologies_message ?? dualObj.km?.apologies_message ?? obj.km?.apologies_message ?? baseEvent?.apologies_message ?? null,
    thank_you_message: obj.km_content?.thank_you_message ?? dualObj.km?.thank_you_message ?? obj.km?.thank_you_message ?? baseEvent?.thank_you_message ?? null,
  };

  const en: LanguageContent = {
    title: obj.en_content?.title ?? dualObj.en?.title ?? obj.en?.title ?? null,
    cover_message: obj.en_content?.cover_message ?? dualObj.en?.cover_message ?? obj.en?.cover_message ?? null,
    countdown_message: obj.en_content?.countdown_message ?? dualObj.en?.countdown_message ?? obj.en?.countdown_message ?? null,
    description: obj.en_content?.description ?? dualObj.en?.description ?? obj.en?.description ?? null,
    venue: obj.en_content?.venue ?? dualObj.en?.venue ?? obj.en?.venue ?? null,
    bride_name: obj.en_content?.bride_name ?? dualObj.en?.bride_name ?? obj.en?.bride_name ?? null,
    groom_name: obj.en_content?.groom_name ?? dualObj.en?.groom_name ?? obj.en?.groom_name ?? null,
    ceremony_time: obj.en_content?.ceremony_time ?? dualObj.en?.ceremony_time ?? obj.en?.ceremony_time ?? null,
    reception_time: obj.en_content?.reception_time ?? dualObj.en?.reception_time ?? obj.en?.reception_time ?? null,
    dress_code: obj.en_content?.dress_code ?? dualObj.en?.dress_code ?? obj.en?.dress_code ?? null,
    qr_code_message: obj.en_content?.qr_code_message ?? dualObj.en?.qr_code_message ?? obj.en?.qr_code_message ?? null,
    qr_account_name: obj.en_content?.qr_account_name ?? dualObj.en?.qr_account_name ?? obj.en?.qr_account_name ?? null,
    apologies_message: obj.en_content?.apologies_message ?? dualObj.en?.apologies_message ?? obj.en?.apologies_message ?? null,
    thank_you_message: obj.en_content?.thank_you_message ?? dualObj.en?.thank_you_message ?? obj.en?.thank_you_message ?? null,
  };

  return { enabled, default_language, km, en };
}

/**
 * Creates default English content based on Khmer inputs or standard wedding phrases.
 */
export function buildEnglishPresets(base: Partial<TemplateData>): LanguageContent {
  const couple = base.bride_name && base.groom_name
    ? `${base.groom_name} & ${base.bride_name}`
    : "Wedding Celebration";

  return {
    title: couple ? `The Wedding of ${couple}` : "Wedding Celebration",
    cover_message: "The Wedding Celebration of",
    countdown_message: "Countdown to the Special Day",
    description: base.description
      ? "We joyfully invite you to celebrate our marriage and share in this special day with our families."
      : null,
    venue: base.venue || "Grand Ballroom, Phnom Penh",
    bride_name: base.bride_name || "Bride",
    groom_name: base.groom_name || "Groom",
    ceremony_time: base.ceremony_time ? "7:00 AM - Traditional Ceremony" : null,
    reception_time: base.reception_time ? "5:00 PM - Wedding Banquet & Reception" : null,
    dress_code: "Formal / Traditional Attire",
    qr_code_message: "Wedding Gift Transfer",
    qr_account_name: base.qr_account_name || "Wedding Gift",
    apologies_message: "We sincerely apologize for any shortcomings or if we were unable to extend our invitation in person. Your blessings and well wishes mean the world to us.",
    thank_you_message: "Our deepest and most heartfelt thanks to our parents, family members, relatives, and esteemed guests for honouring us with your presence and warm wishes.",
  };
}

/**
 * Returns a new TemplateData with text content swapped to the requested language.
 * Visual properties, images, styles, and music URLs are preserved untouched.
 */
export function resolveEventContent(
  event: TemplateData,
  language: LanguageCode,
  dualConfig?: DualLanguageConfig
): TemplateData {
  if (!dualConfig || !dualConfig.enabled || language === "km") {
    // If language is Khmer, use km content overrides if provided, or default event
    if (dualConfig?.enabled && dualConfig.km) {
      return {
        ...event,
        title: dualConfig.km.title?.trim() || event.title,
        cover_message: dualConfig.km.cover_message ?? event.cover_message,
        countdown_message: dualConfig.km.countdown_message ?? event.countdown_message,
        description: dualConfig.km.description ?? event.description,
        venue: dualConfig.km.venue ?? event.venue,
        bride_name: dualConfig.km.bride_name ?? event.bride_name,
        groom_name: dualConfig.km.groom_name ?? event.groom_name,
        ceremony_time: dualConfig.km.ceremony_time ?? event.ceremony_time,
        reception_time: dualConfig.km.reception_time ?? event.reception_time,
        dress_code: dualConfig.km.dress_code ?? event.dress_code,
        qr_code_message: dualConfig.km.qr_code_message ?? event.qr_code_message,
        qr_account_name: dualConfig.km.qr_account_name ?? event.qr_account_name,
        apologies_message: dualConfig.km.apologies_message ?? event.apologies_message,
        thank_you_message: dualConfig.km.thank_you_message ?? event.thank_you_message,
      };
    }
    return event;
  }

  // English version requested
  const en = dualConfig.en;
  const presets = buildEnglishPresets(event);

  return {
    ...event,
    title: en.title?.trim() || presets.title || event.title,
    cover_message: en.cover_message?.trim() || presets.cover_message || event.cover_message,
    countdown_message: en.countdown_message?.trim() || presets.countdown_message || event.countdown_message,
    description: en.description?.trim() || presets.description || event.description,
    venue: en.venue?.trim() || event.venue,
    bride_name: en.bride_name?.trim() || event.bride_name,
    groom_name: en.groom_name?.trim() || event.groom_name,
    ceremony_time: en.ceremony_time?.trim() || presets.ceremony_time || event.ceremony_time,
    reception_time: en.reception_time?.trim() || presets.reception_time || event.reception_time,
    dress_code: en.dress_code?.trim() || presets.dress_code || event.dress_code,
    qr_code_message: en.qr_code_message?.trim() || presets.qr_code_message || event.qr_code_message,
    qr_account_name: en.qr_account_name?.trim() || event.qr_account_name,
    apologies_message: en.apologies_message?.trim() || presets.apologies_message || event.apologies_message,
    thank_you_message: en.thank_you_message?.trim() || presets.thank_you_message || event.thank_you_message,
  };
}
