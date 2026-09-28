/**
 * Section visibility — per-event toggles for the invitation page.
 *
 * Each section on the rendered invitation can be turned on or off. Defaults
 * live in three layers:
 *   1. Built-in defaults (this file) — always show everything.
 *   2. Template-level defaults (templates.config.section_visibility).
 *   3. Per-event overrides (events.section_visibility).
 *
 * `mergeVisibility` walks those layers in order so the event override wins
 * over the template default which wins over the built-in default.
 *
 * The order of `SECTION_KEYS` matches the order sections actually appear on
 * the invitation page — admin UIs use this list directly so the toggle list
 * mirrors the live rendering.
 */

export type SectionKey =
  | "title"
  | "parents"
  | "honorific"
  | "description"
  | "couple_names"
  | "details"
  | "agenda"
  | "gallery"
  | "countdown"
  | "qr_code"
  | "apologies"
  | "thank_you"
  | "location"
  | "rsvp"
  | "floating_contact"
  | "background_music"
  | "side_frame"
  | "footer";

export type SectionVisibility = Partial<Record<SectionKey, boolean>>;

/** Display metadata for the admin toggle UI. Order matches the invitation. */
export const SECTION_DEFINITIONS: { key: SectionKey; label: string; description: string }[] = [
  { key: "title",            label: "Event title",          description: "Top headline (Moul gold)." },
  { key: "parents",          label: "Parents",              description: "Two rows × two columns of parent names." },
  { key: "honorific",        label: "Honorific invitation", description: "សូមគោរពអញ្ជើញ + invitation paragraph." },
  { key: "description",      label: "Description",          description: "Free-form description paragraph." },
  { key: "couple_names",     label: "Couple names",         description: "Bride & groom names with the cover image." },
  { key: "details",          label: "Date · venue · dress", description: "Date sentence, venue, dress code & map button." },
  { key: "agenda",           label: "Agenda",               description: "Multi-day program (list / cards)." },
  { key: "gallery",          label: "Photo gallery",        description: "Mosaic of uploaded photos." },
  { key: "countdown",        label: "Countdown",            description: "Days remaining until the event." },
  { key: "qr_code",          label: "QR code (gift)",       description: "Scan-to-transfer QR with editable message and account name." },
  { key: "apologies",        label: "Apologies letter",     description: "លិខិតសូមអភ័យទោស — editable apology message." },
  { key: "thank_you",        label: "Thank-you letter",     description: "លិខិតថ្លែងអំណរគុណ — editable gratitude letter." },
  { key: "location",         label: "Location & map",       description: "Embedded Google Map." },
  { key: "rsvp",             label: "RSVP form",            description: "Guest reply card." },
  { key: "floating_contact", label: "Floating contact",     description: "Bottom-right contact widget." },
  { key: "background_music", label: "Background music",     description: "Floating music disc controller." },
  { key: "side_frame",       label: "Ornamental side frame", description: "Decorative ornate frame borders displayed on the sides of the screen." },
  { key: "footer",           label: "Footer",               description: "Logo + footer text + social links." },
];

export const SECTION_KEYS: SectionKey[] = SECTION_DEFINITIONS.map((s) => s.key);

/** Built-in defaults — every section is visible unless overridden. */
const BUILT_IN_DEFAULTS: Record<SectionKey, boolean> = SECTION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as Record<SectionKey, boolean>,
);

/** Coerce raw jsonb into a sane partial map (drops unknown keys). */
export function normalizeVisibility(raw: unknown): SectionVisibility {
  if (!raw || typeof raw !== "object") return {};
  const out: SectionVisibility = {};
  for (const k of SECTION_KEYS) {
    const v = (raw as any)[k];
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

/**
 * Resolve the final visibility map to use when rendering. Event overrides
 * win, then template defaults, then built-ins.
 */
export function mergeVisibility(
  templateDefaults: unknown,
  eventOverride: unknown,
): Record<SectionKey, boolean> {
  const td = normalizeVisibility(templateDefaults);
  const ev = normalizeVisibility(eventOverride);
  const out = { ...BUILT_IN_DEFAULTS };
  for (const k of SECTION_KEYS) {
    if (k in td) out[k] = td[k]!;
    if (k in ev) out[k] = ev[k]!;
  }
  return out;
}

/** Convenience for the InvitationTemplate, which receives the merged map. */
export type ResolvedVisibility = Record<SectionKey, boolean>;
