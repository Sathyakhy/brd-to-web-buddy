import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InvitationTemplate, type TemplateData } from "@/components/templates/InvitationTemplate";
import KhmerTraditionalCover from "@/components/templates/KhmerTraditionalCover";
import SignaturePackageCover from "@/components/templates/SignaturePackageCover";
import RsvpCard from "@/components/templates/RsvpCard";
import FloatingMusicPlayer from "@/components/templates/FloatingMusicPlayer";
import FloatingLanguageSwitch from "@/components/templates/FloatingLanguageSwitch";
import { LanguageCode, getDualLanguageConfig } from "@/lib/dualLanguage";
import { generateToken } from "@/lib/invitation";
import { normalizeMusicSettings } from "@/lib/musicSettings";
import { normalizeEnvelopeConfig } from "@/lib/envelopeUnboxing";
import { normalizeCoverInvitationStyle } from "@/lib/coverInvitationStyle";
import { normalizeGuestNameStyle } from "@/lib/guestNameStyle";
import Interactive3DEnvelopeUnboxing from "@/components/templates/Interactive3DEnvelopeUnboxing";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { UserCheck } from "lucide-react";
import { sendTelegramRsvpNotification } from "@/utils/telegramNotification";

type Event = TemplateData & {
  id: string; slug: string; template: string;
  access_starts_at?: string | null;
  access_ends_at?: string | null;
  dual_language_config?: unknown;
};

type Guest = {
  id: string; name: string; rsvp_status: string;
  party_size: number; message: string | null;
};

export default function InvitePage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const token = params.get("token");
  // Preview mode — used by admin "View public page". Skips the cover screen
  // and renders the invitation directly with no guest name personalization.
  const isPreview = token === "preview";

  const [event, setEvent] = useState<Event | null>(null);
  const [templateVisibility, setTemplateVisibility] = useState<unknown>({});
  const [templateDefaults, setTemplateDefaults] = useState<any>({});
  const [baseRenderer, setBaseRenderer] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const [unboxingActive, setUnboxingActive] = useState(false);
  const [musicPlayTrigger, setMusicPlayTrigger] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>("km");
  const [dbToken, setDbToken] = useState<string | null>(null);

  // Prevent background scrolling on document body only while the cover is active
  const effectiveTemplate = baseRenderer || event?.template;
  const isEssentials =
    effectiveTemplate === "essentials-package-01" ||
    effectiveTemplate === "essentials-package" ||
    effectiveTemplate === "khmer-traditional";

  const isSignature = effectiveTemplate === "signature-package-01";

  const isCoverActive = !opened && !isPreview && (isEssentials || isSignature);

  useEffect(() => {
    if (isCoverActive) {
      const origOverflow = document.body.style.overflow;
      const origDocOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origDocOverflow;
      };
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
  }, [isCoverActive]);

  const isBroadcastToken = (tok?: string | null) => {
    if (!tok) return true;
    const t = tok.toLowerCase().trim();
    return (
      t.startsWith("broadcast-") ||
      t.startsWith("broadcast") ||
      t.startsWith("open-") ||
      t.startsWith("open") ||
      t.startsWith("public") ||
      t.startsWith("general-") ||
      t.startsWith("general") ||
      t === "km" ||
      t === "en" ||
      t === "kh"
    );
  };

  const rawToken = token?.trim() || "";
  const isOpenInvite = isPreview ? false : isBroadcastToken(rawToken);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    (async () => {
      try {
        const rawTok = token?.trim() || "";
        const isOpen = isPreview ? false : isBroadcastToken(rawTok);

        const [evResponse, guestResponse] = await Promise.all([
          supabase.rpc("get_event_public_by_slug", { _slug: slug }),
          (isPreview || isOpen)
            ? Promise.resolve({ data: null, error: null })
            : supabase.rpc("get_guest_by_token", { _event_slug: slug, _token: rawTok }),
        ]);

        const evRows = evResponse.data;
        const ev = Array.isArray(evRows) ? evRows[0] : evRows;
        if (!ev) { setLoading(false); return; }

        const agenda_bg_color = (ev as any).agenda_bg_color ?? (ev as any).section_visibility?.agenda_style?.bg_color ?? (ev as any).section_visibility?.agenda_bg_color ?? null;
        const agenda_bg_opacity = (ev as any).agenda_bg_opacity ?? (ev as any).section_visibility?.agenda_style?.bg_opacity ?? (ev as any).section_visibility?.agenda_bg_opacity ?? null;
        const agenda_asset_color = (ev as any).agenda_asset_color ?? (ev as any).section_visibility?.agenda_style?.asset_color ?? (ev as any).section_visibility?.agenda_asset_color ?? null;
        const side_frame_config = (ev as any).side_frame_config ?? (ev as any).section_visibility?.side_frame_config ?? null;
        setEvent({
          ...ev,
          agenda_bg_color,
          agenda_bg_opacity,
          agenda_asset_color,
          side_frame_config,
        } as Event);

        const dualCfg = getDualLanguageConfig(
          (ev as any).dual_language_config ??
          (ev as any).section_visibility?.dual_language ??
          (ev as any).section_visibility,
          ev
        );

        const urlLang = params.get("lang") || params.get("language");
        const normalizedUrlLang = (urlLang === "en" || urlLang === "km" || urlLang === "kh")
          ? (urlLang === "kh" ? "km" : (urlLang as LanguageCode))
          : null;

        const tokenLower = rawTok.toLowerCase();
        const tokenLang = (tokenLower.endsWith("-en") || tokenLower === "en" || tokenLower === "broadcast-en" || tokenLower === "open-en")
          ? "en"
          : (tokenLower.endsWith("-km") || tokenLower.endsWith("-kh") || tokenLower === "km" || tokenLower === "kh" || tokenLower === "broadcast-km" || tokenLower === "open-km")
          ? "km"
          : null;

        // Token language takes precedence over query parameters and defaults!
        const initialLang = tokenLang || normalizedUrlLang || dualCfg.default_language || "km";
        setLanguage(initialLang);

        if (isPreview) {
          // Synthetic guest used purely for the public preview — no name,
          // neutral RSVP defaults, never persisted.
          setGuest({
            id: "preview",
            name: "",
            rsvp_status: "pending",
            party_size: 1,
            message: null,
          });
          setDbToken("preview");
        } else if (isOpen) {
          const defaultOpenGreeting = initialLang === "en"
            ? ((ev as any).open_guest_greeting_en || (ev as any).section_visibility?.open_guest_greeting_en || "Honored Guest")
            : ((ev as any).open_guest_greeting_km || (ev as any).section_visibility?.open_guest_greeting_km || "ភ្ញៀវកិត្តិយស");

          // Restore saved broadcast session from device localStorage if present
          let restored = false;
          try {
            const rawSession = localStorage.getItem(`rsvp_broadcast_session_${slug}`);
            if (rawSession) {
              const session = JSON.parse(rawSession);
              if (session && session.token && (session.status === "yes" || session.status === "no")) {
                setGuest({
                  id: "saved-session",
                  name: session.name || defaultOpenGreeting,
                  rsvp_status: session.status,
                  party_size: session.party_size || 1,
                  message: session.message || null,
                });
                setPartySize(session.party_size || 1);
                setMessage(session.message || "");
                setDbToken(session.token);
                restored = true;
              }
            }
          } catch (_) {}

          if (!restored) {
            setGuest({
              id: "open",
              name: defaultOpenGreeting,
              rsvp_status: "pending",
              party_size: 1,
              message: null,
            });
            setDbToken(rawTok);
          }
        } else {
          // Named token or lookup path:
          const gRows = guestResponse?.data;
          const g = Array.isArray(gRows) ? gRows[0] : gRows;
          if (g) {
            setGuest(g as Guest);
            setPartySize(g.party_size);
            setMessage(g.message ?? "");
            setDbToken(rawTok);
          } else {
            // Token was provided but not found directly.
            // If the token has a language suffix (e.g. -en or -km), try looking up with the base token!
            const baseTok = rawTok.replace(/-(en|km|kh)$/i, "");
            let baseGuest: Guest | null = null;
            if (baseTok !== rawTok) {
              try {
                const { data: baseData } = await supabase.rpc("get_guest_by_token", { _event_slug: slug, _token: baseTok });
                const bRows = Array.isArray(baseData) ? baseData : (baseData ? [baseData] : []);
                if (bRows.length > 0 && bRows[0]) {
                  baseGuest = bRows[0] as Guest;
                }
              } catch (_) {}
            }

            if (baseGuest) {
              setGuest(baseGuest);
              setPartySize(baseGuest.party_size);
              setMessage(baseGuest.message ?? "");
              setDbToken(baseTok);
            } else {
              // Token was not found in DB, fallback gracefully to open guest greeting
              const defaultOpenGreeting = initialLang === "en"
                ? ((ev as any).open_guest_greeting_en || (ev as any).section_visibility?.open_guest_greeting_en || "Honored Guest")
                : ((ev as any).open_guest_greeting_km || (ev as any).section_visibility?.open_guest_greeting_km || "ភ្ញៀវកិត្តិយស");
              setGuest({
                id: "open",
                name: defaultOpenGreeting,
                rsvp_status: "pending",
                party_size: 1,
                message: null,
              });
              setDbToken(rawTok);
            }
          }
        }

        // Pull the template's default section visibility so the merge in
        // <InvitationTemplate> can fall through to it when the event hasn't
        // overridden a given key.
        const { data: tpl } = await supabase
          .from("templates")
          .select("config, base_renderer")
          .eq("slug", (ev as any).template)
          .maybeSingle();
        if (tpl?.base_renderer) {
          setBaseRenderer(tpl.base_renderer);
        }
        const cfg = (tpl?.config as any) ?? {};
        setTemplateVisibility(cfg.section_visibility ?? {});
        setTemplateDefaults({
          qr_code_url: cfg.qr_code_url ?? null,
          qr_code_message: cfg.qr_code_message ?? null,
          qr_account_name: cfg.qr_account_name ?? null,
          apologies_message: cfg.apologies_message ?? null,
          thank_you_message: cfg.thank_you_message ?? null,
          letter_bg_color: cfg.letter_bg_color ?? null,
          letter_bg_opacity: cfg.letter_bg_opacity ?? null,
          agenda_bg_color: cfg.agenda_bg_color ?? cfg.section_visibility?.agenda_style?.bg_color ?? null,
          agenda_bg_opacity: cfg.agenda_bg_opacity ?? cfg.section_visibility?.agenda_style?.bg_opacity ?? null,
          agenda_asset_color: cfg.agenda_asset_color ?? cfg.section_visibility?.agenda_style?.asset_color ?? null,
          map_button_bg_color: cfg.map_button_bg_color ?? cfg.section_visibility?.map_button_bg_color ?? null,
          map_button_bg_opacity: typeof cfg.map_button_bg_opacity === "number" ? cfg.map_button_bg_opacity : (typeof cfg.section_visibility?.map_button_bg_opacity === "number" ? cfg.section_visibility?.map_button_bg_opacity : null),
          countdown_bg_color: cfg.countdown_bg_color ?? cfg.section_visibility?.countdown_bg_color ?? null,
          countdown_bg_opacity: typeof cfg.countdown_bg_opacity === "number" ? cfg.countdown_bg_opacity : (typeof cfg.section_visibility?.countdown_bg_opacity === "number" ? cfg.section_visibility?.countdown_bg_opacity : null),
          rsvp_bg_color: cfg.rsvp_bg_color ?? cfg.section_visibility?.rsvp_bg_color ?? null,
          rsvp_bg_opacity: typeof cfg.rsvp_bg_opacity === "number" ? cfg.rsvp_bg_opacity : (typeof cfg.section_visibility?.rsvp_bg_opacity === "number" ? cfg.section_visibility?.rsvp_bg_opacity : null),
          rsvp_header_font: cfg.rsvp_header_font ?? cfg.section_visibility?.rsvp_header_font ?? cfg.section_visibility?.rsvp_style?.header_font ?? null,
          rsvp_header_font_en: cfg.rsvp_header_font_en ?? cfg.section_visibility?.rsvp_header_font_en ?? cfg.section_visibility?.rsvp_style?.header_font_en ?? null,
          rsvp_body_font: cfg.rsvp_body_font ?? cfg.section_visibility?.rsvp_body_font ?? cfg.section_visibility?.rsvp_style?.body_font ?? null,
          rsvp_body_font_en: cfg.rsvp_body_font_en ?? cfg.section_visibility?.rsvp_body_font_en ?? cfg.section_visibility?.rsvp_style?.body_font_en ?? null,
          rsvp_header_effect: cfg.rsvp_header_effect ?? cfg.section_visibility?.rsvp_header_effect ?? cfg.section_visibility?.rsvp_style?.header_effect ?? null,
          rsvp_header_effect_color: cfg.rsvp_header_effect_color ?? cfg.section_visibility?.rsvp_header_effect_color ?? cfg.section_visibility?.rsvp_style?.header_effect_color ?? null,
          rsvp_header_effect_blur: typeof cfg.rsvp_header_effect_blur === "number" ? cfg.rsvp_header_effect_blur : (typeof cfg.section_visibility?.rsvp_header_effect_blur === "number" ? cfg.section_visibility?.rsvp_header_effect_blur : cfg.section_visibility?.rsvp_style?.header_effect_blur ?? null),
          rsvp_header_effect_x: typeof cfg.rsvp_header_effect_x === "number" ? cfg.rsvp_header_effect_x : (typeof cfg.section_visibility?.rsvp_header_effect_x === "number" ? cfg.section_visibility?.rsvp_header_effect_x : cfg.section_visibility?.rsvp_style?.header_effect_x ?? null),
          rsvp_header_effect_y: typeof cfg.rsvp_header_effect_y === "number" ? cfg.rsvp_header_effect_y : (typeof cfg.section_visibility?.rsvp_header_effect_y === "number" ? cfg.section_visibility?.rsvp_header_effect_y : cfg.section_visibility?.rsvp_style?.header_effect_y ?? null),
          rsvp_header_effect_opacity: typeof cfg.rsvp_header_effect_opacity === "number" ? cfg.rsvp_header_effect_opacity : (typeof cfg.section_visibility?.rsvp_header_effect_opacity === "number" ? cfg.section_visibility?.rsvp_header_effect_opacity : cfg.section_visibility?.rsvp_style?.header_effect_opacity ?? null),
          rsvp_card_shadow_type: cfg.rsvp_card_shadow_type ?? cfg.section_visibility?.rsvp_card_shadow_type ?? cfg.section_visibility?.rsvp_style?.card_shadow_type ?? null,
          rsvp_card_shadow_color: cfg.rsvp_card_shadow_color ?? cfg.section_visibility?.rsvp_card_shadow_color ?? cfg.section_visibility?.rsvp_style?.card_shadow_color ?? null,
          rsvp_card_shadow_blur: typeof cfg.rsvp_card_shadow_blur === "number" ? cfg.rsvp_card_shadow_blur : (typeof cfg.section_visibility?.rsvp_card_shadow_blur === "number" ? cfg.section_visibility?.rsvp_card_shadow_blur : cfg.section_visibility?.rsvp_style?.card_shadow_blur ?? null),
          rsvp_card_shadow_spread: typeof cfg.rsvp_card_shadow_spread === "number" ? cfg.rsvp_card_shadow_spread : (typeof cfg.section_visibility?.rsvp_card_shadow_spread === "number" ? cfg.section_visibility?.rsvp_card_shadow_spread : cfg.section_visibility?.rsvp_style?.card_shadow_spread ?? null),
          rsvp_card_shadow_x: typeof cfg.rsvp_card_shadow_x === "number" ? cfg.rsvp_card_shadow_x : (typeof cfg.section_visibility?.rsvp_card_shadow_x === "number" ? cfg.section_visibility?.rsvp_card_shadow_x : cfg.section_visibility?.rsvp_style?.card_shadow_x ?? null),
          rsvp_card_shadow_y: typeof cfg.rsvp_card_shadow_y === "number" ? cfg.rsvp_card_shadow_y : (typeof cfg.section_visibility?.rsvp_card_shadow_y === "number" ? cfg.section_visibility?.rsvp_card_shadow_y : cfg.section_visibility?.rsvp_style?.card_shadow_y ?? null),
          rsvp_card_shadow_opacity: typeof cfg.rsvp_card_shadow_opacity === "number" ? cfg.rsvp_card_shadow_opacity : (typeof cfg.section_visibility?.rsvp_card_shadow_opacity === "number" ? cfg.section_visibility?.rsvp_card_shadow_opacity : cfg.section_visibility?.rsvp_style?.card_shadow_opacity ?? null),
          side_frame_config: cfg.side_frame_config ?? cfg.section_visibility?.side_frame_config ?? null,
          frame_url: cfg.frame_url ?? null,
          frame_type: (cfg.frame_type as "image" | "video") ?? "image",
          cover_music_url: cfg.cover_music_url ?? null,
          text_effect_config: cfg.text_effect_config ?? null,
          header_font: cfg.header_font ?? null,
          header_font_km: cfg.header_font_km ?? cfg.header_font ?? null,
          header_font_en: cfg.header_font_en ?? null,
          body_font: cfg.body_font ?? null,
          body_font_km: cfg.body_font_km ?? cfg.body_font ?? null,
          body_font_en: cfg.body_font_en ?? null,
          envelope_unboxing: cfg.envelope_unboxing ?? cfg.section_visibility?.envelope_unboxing ?? null,
          music_autoplay_cover: cfg.music_autoplay_cover ?? cfg.section_visibility?.music_autoplay_cover ?? true,
          music_autoplay_invitation: cfg.music_autoplay_invitation ?? cfg.section_visibility?.music_autoplay_invitation ?? true,
          music_autoplay_mode: cfg.music_autoplay_mode ?? cfg.section_visibility?.music_autoplay_mode ?? null,
        });
      } catch (err: any) {
        console.error("Failed to load invite:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, token, isPreview]);

  type DuplicatePending = {
    matchedGuest: any;
    status: "yes" | "no";
    chosenPartySize: number;
    chosenMessage: string;
    submittedName: string;
    eventGuests: any[];
  };

  const [duplicatePending, setDuplicatePending] = useState<DuplicatePending | null>(null);
  const lastDispatchedTelegramRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });

  const triggerTelegramNotification = (
    respondentName: string,
    rsvpStatus: "yes" | "no",
    size: number,
    wishes: string,
    isEdit: boolean
  ) => {
    if (!event) return;
    const vis = (event.section_visibility as any) ?? {};
    const enabled = vis.telegram_notifications_enabled !== false;
    const chatId = vis.telegram_chat_id || (event as any).telegram_chat_id;
    const botToken = vis.telegram_bot_token || (event as any).telegram_bot_token;

    const dispatchKey = `${slug}:${respondentName}:${rsvpStatus}:${size}:${wishes}:${isEdit}`;
    const now = Date.now();
    if (
      lastDispatchedTelegramRef.current.key === dispatchKey &&
      now - lastDispatchedTelegramRef.current.time < 8000
    ) {
      // Prevent duplicate notification dispatch
      return;
    }
    lastDispatchedTelegramRef.current = { key: dispatchKey, time: now };

    if (chatId && enabled) {
      sendTelegramRsvpNotification({
        chatId,
        botToken,
        eventTitle: event.title || "Wedding Invitation",
        guestName: respondentName,
        status: rsvpStatus,
        partySize: size,
        message: wishes,
        isEdit,
        language,
        eventSlug: slug,
      }).catch((err) => console.warn("Telegram notification dispatch error:", err));
    }
  };

  const executeRsvpSubmission = async (opts: {
    targetTokenOverride?: string | null;
    status: "yes" | "no";
    size: number;
    msg: string;
    gName: string;
    eventGuests?: any[];
  }) => {
    if (!slug) return;
    setSubmitting(true);
    const { targetTokenOverride, status, size, msg, gName, eventGuests = [] } = opts;
    const rawTok = token?.trim() || "";
    const isOpen = isPreview ? false : isBroadcastToken(rawTok);

    let chosenToken = targetTokenOverride || dbToken || rawTok || (isOpen ? `broadcast-${language}` : "");

    // If open invite and no specific token override or valid non-broadcast token, allocate a new slot:
    if (isOpen && !targetTokenOverride && (!dbToken || isBroadcastToken(dbToken))) {
      // 1. Try submit_open_rsvp RPC (if available on the database)
      try {
        const { data: openData, error: openErr } = await (supabase.rpc as any)("submit_open_rsvp", {
          _event_slug: slug,
          _name: gName,
          _status: status,
          _party_size: size,
          _message: msg || null,
          _language: language,
        });
        if (!openErr && openData) {
          const newG = openData as Guest;
          const assignedTok = (newG as any).token || (openData as any).token || chosenToken;
          setGuest({
            ...newG,
            name: gName || newG.name,
            rsvp_status: status,
            party_size: size,
            message: msg || null,
          });
          setPartySize(size);
          setMessage(msg);
          setDbToken(assignedTok);
          try {
            localStorage.setItem(`rsvp_broadcast_session_${slug}`, JSON.stringify({
              token: assignedTok,
              name: gName,
              status,
              party_size: size,
              message: msg,
              responded_at: new Date().toISOString(),
            }));
          } catch (_) {}
          toast.success(
            language === "en"
              ? (status === "yes" ? "Thank you for accepting 💛" : "Your response has been recorded")
              : (status === "yes" ? "សូមអរគុណសម្រាប់ការឆ្លើយតបចូលរួម 💛" : "សូមអរគុណ ការឆ្លើយតបរបស់អ្នកត្រូវបានកត់ត្រា")
          );
          triggerTelegramNotification(gName || newG.name, status, size, msg, false);
          setSubmitting(false);
          return;
        }
      } catch (_) {}

      // 2. Find an available unassigned broadcast slot from broadcast_pool or dynamically query available slots
      const langPrefix = `broadcast-${language}`;
      const pool: string[] = (event as any)?.section_visibility?.broadcast_pool?.[language] || [];
      const candidates: string[] = [
        ...pool.filter(t => t.startsWith(langPrefix) && t !== langPrefix),
        ...Array.from({ length: 50 }, (_, i) => `${langPrefix}-${(i + 1).toString().padStart(3, "0")}`),
        `${langPrefix}-01`,
        `${langPrefix}-02`,
        `${langPrefix}-03`,
        `${langPrefix}-04`,
        `${langPrefix}-05`,
        langPrefix,
      ];

      // Deduplicate candidates
      const uniqueCandidates = Array.from(new Set(candidates));

      let foundEmptySlot: string | null = null;

      for (const cand of uniqueCandidates) {
        try {
          const { data: gData, error: gErr } = await supabase.rpc("get_guest_by_token", {
            _event_slug: slug,
            _token: cand,
          });
          if (!gErr && gData) {
            const rows = Array.isArray(gData) ? gData : [gData];
            const g = rows[0];
            if (g && g.rsvp_status === "pending" && !g.responded_at && (!g.message || !g.message.trim())) {
              foundEmptySlot = cand;
              break;
            }
          }
        } catch (_) {}
      }

      if (foundEmptySlot) {
        chosenToken = foundEmptySlot;
      } else {
        chosenToken = `${langPrefix}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const effectiveMsg = (isOpen && gName && gName !== "Honored Guest" && gName !== "ភ្ញៀវកិត្តិយស")
      ? `[${gName}] ${msg}`.trim()
      : msg;

    try {
      let rsvpSuccess = false;
      let recordedGuest: Guest | null = null;

      if (!isPreview && chosenToken) {
        try {
          const { data, error } = await supabase.rpc("submit_rsvp", {
            _event_slug: slug,
            _token: chosenToken,
            _status: status,
            _party_size: size,
            _message: effectiveMsg || null,
          });

          if (!error && data) {
            rsvpSuccess = true;
            recordedGuest = data as Guest;
          } else if (error) {
            console.warn("submit_rsvp error:", error.message);
            const base = chosenToken.replace(/-(en|km|kh)$/i, "");
            if (base !== chosenToken) {
              const retry = await supabase.rpc("submit_rsvp", {
                _event_slug: slug,
                _token: base,
                _status: status,
                _party_size: size,
                _message: effectiveMsg || null,
              });
              if (!retry.error && retry.data) {
                rsvpSuccess = true;
                recordedGuest = retry.data as Guest;
                chosenToken = base;
              }
            }
          }
        } catch (rpcErr) {
          console.warn("RPC call error:", rpcErr);
        }
      }

      const updated: Guest = {
        id: recordedGuest?.id || guest?.id || "guest-" + Date.now(),
        name: gName || (language === "en" ? "Honored Guest" : "ភ្ញៀវកិត្តិយស"),
        rsvp_status: status,
        party_size: size,
        message: effectiveMsg || null,
      };
      setGuest(updated);
      setPartySize(size);
      setMessage(msg);
      setDbToken(chosenToken);

      // Save session on device so guest cannot accept again, but can edit:
      try {
        localStorage.setItem(`rsvp_broadcast_session_${slug}`, JSON.stringify({
          token: chosenToken,
          name: updated.name,
          status,
          party_size: size,
          message: msg,
          responded_at: new Date().toISOString(),
        }));
      } catch (_) {}

      toast.success(
        language === "en"
          ? (status === "yes" ? "Thank you for accepting 💛" : "Your response has been recorded")
          : (status === "yes" ? "សូមអរគុណសម្រាប់ការឆ្លើយតបចូលរួម 💛" : "សូមអរគុណ ការឆ្លើយតបរបស់អ្នកត្រូវបានកត់ត្រា")
      );

      triggerTelegramNotification(
        updated.name || gName,
        status,
        size,
        msg,
        Boolean(targetTokenOverride && targetTokenOverride === chosenToken)
      );
    } catch (err: any) {
      console.error("RSVP error:", err);
      setGuest(prev => prev ? { ...prev, rsvp_status: status, party_size: size, message: effectiveMsg || null } : null);
      toast.success(
        language === "en"
          ? (status === "yes" ? "Thank you for accepting 💛" : "Your response has been recorded")
          : (status === "yes" ? "សូមអរគុណសម្រាប់ការឆ្លើយតបចូលរួម 💛" : "សូមអរគុណ ការឆ្លើយតបរបស់អ្នកត្រូវបានកត់ត្រា")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (status: "yes" | "no", chosenPartySize?: number, chosenMessage?: string, submittedName?: string) => {
    if (!slug) return;
    const size = typeof chosenPartySize === "number" ? chosenPartySize : partySize;
    const msg = typeof chosenMessage === "string" ? chosenMessage : message;
    const rawTok = token?.trim() || "";
    const isOpen = isPreview ? false : isBroadcastToken(rawTok);
    const gName = (submittedName || guest?.name || "").trim();

    // Check if device already has a saved broadcast session:
    const sessionKey = `rsvp_broadcast_session_${slug}`;
    let savedSession: any = null;
    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) savedSession = JSON.parse(raw);
    } catch (_) {}

    // If this is an EDIT of an already saved response on this device:
    if (isOpen && savedSession && savedSession.token && dbToken === savedSession.token) {
      await executeRsvpSubmission({
        targetTokenOverride: savedSession.token,
        status,
        size,
        msg,
        gName: gName || savedSession.name,
      });
      return;
    }

    // For open broadcast invites without a saved session, check for duplicate name among existing responded guests:
    if (isOpen && event?.id && gName && gName !== "Honored Guest" && gName !== "ភ្ញៀវកិត្តិយស") {
      try {
        const { data: allGuests } = await supabase
          .from("guests")
          .select("id, name, token, rsvp_status, party_size, message, responded_at")
          .eq("event_id", event.id);

        const responded = (allGuests || []).filter(g => g.rsvp_status === "yes" || g.rsvp_status === "no");
        const normalized = gName.trim().toLowerCase();
        const match = responded.find(g => {
          const direct = g.name && g.name.trim().toLowerCase() === normalized;
          const inMsg = g.message && (
            g.message.startsWith(`[${gName.trim()}]`) ||
            g.message.toLowerCase().startsWith(`[${normalized}]`)
          );
          return direct || inMsg;
        });

        if (match) {
          // Ask them to confirm if they already responded!
          setDuplicatePending({
            matchedGuest: match,
            status,
            chosenPartySize: size,
            chosenMessage: msg,
            submittedName: gName,
            eventGuests: allGuests || [],
          });
          return;
        }

        // No duplicate found, proceed to allocate a new slot:
        await executeRsvpSubmission({
          targetTokenOverride: null,
          status,
          size,
          msg,
          gName,
          eventGuests: allGuests || [],
        });
        return;
      } catch (err) {
        console.warn("Error checking duplicate names:", err);
      }
    }

    // Default flow for named invite or fallback:
    await executeRsvpSubmission({
      targetTokenOverride: dbToken || null,
      status,
      size,
      msg,
      gName,
    });
  };

  const handleConfirmDuplicateYes = () => {
    if (!duplicatePending) return;
    const { matchedGuest, status, chosenPartySize, chosenMessage, submittedName, eventGuests } = duplicatePending;
    setDuplicatePending(null);
    executeRsvpSubmission({
      targetTokenOverride: matchedGuest.token,
      status,
      size: chosenPartySize,
      msg: chosenMessage,
      gName: submittedName,
      eventGuests,
    });
  };

  const handleConfirmDuplicateNo = () => {
    if (!duplicatePending) return;
    const { status, chosenPartySize, chosenMessage, submittedName, eventGuests } = duplicatePending;
    setDuplicatePending(null);
    executeRsvpSubmission({
      targetTokenOverride: null, // Allocate a fresh new slot!
      status,
      size: chosenPartySize,
      msg: chosenMessage,
      gName: submittedName,
      eventGuests,
    });
  };

  if (loading) {
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading invitation…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-4xl text-gradient-gold mb-3">Invalid invitation</h1>
          <p className="text-muted-foreground mb-6">
            This invitation link is invalid or has expired. Please contact the host.
          </p>
          <Link to={slug ? `/${slug}` : "/"} className="text-gold hover:underline">Go to event page</Link>
        </div>
      </div>
    );
  }

  const activeGuest: Guest = guest || {
    id: "open",
    name: language === "en"
      ? ((event as any).open_guest_greeting_en || (event as any).section_visibility?.open_guest_greeting_en || "Honored Guest")
      : ((event as any).open_guest_greeting_km || (event as any).section_visibility?.open_guest_greeting_km || "ភ្ញៀវកិត្តិយស"),
    rsvp_status: "pending",
    party_size: 1,
    message: null,
  };

  // Access window — admins can configure a start/end date during which the
  // invitation is viewable. Outside that window we show a friendly notice.
  const now = Date.now();
  const startsAt = event.access_starts_at ? new Date(event.access_starts_at).getTime() : null;
  const endsAt = event.access_ends_at ? new Date(event.access_ends_at).getTime() : null;
  if ((startsAt && now < startsAt) || (endsAt && now > endsAt)) {
    const notYet = startsAt && now < startsAt;
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-4xl text-gradient-gold mb-3">
            {notYet ? "Coming soon" : "Invitation closed"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {notYet
              ? `This invitation will be available on ${new Date(startsAt!).toLocaleString()}.`
              : "This invitation is no longer available. Thank you for your interest."}
          </p>
        </div>
      </div>
    );
  }

  const dualCfg = getDualLanguageConfig(
    (event as any).dual_language_config ??
    (event as any).section_visibility?.dual_language ??
    (event as any).section_visibility,
    event
  );
  const rsvpForm = (
    <RsvpCard
      guestName={activeGuest.name}
      isOpenInvite={isOpenInvite}
      status={activeGuest.rsvp_status}
      initialPartySize={partySize}
      initialMessage={message}
      submitting={submitting}
      accentColor={(event as any).text_color_accent ?? undefined}
      primaryColor={(event as any).text_color_primary ?? undefined}
      bgColor={(event as any).rsvp_bg_color ?? (event as any).section_visibility?.rsvp_bg_color ?? (event as any).section_visibility?.rsvp_style?.bg_color ?? (templateDefaults as any)?.rsvp_bg_color ?? (templateDefaults as any)?.rsvp_style?.bg_color ?? null}
      bgOpacity={typeof (event as any).rsvp_bg_opacity === "number" ? (event as any).rsvp_bg_opacity : (typeof (event as any).section_visibility?.rsvp_bg_opacity === "number" ? (event as any).section_visibility?.rsvp_bg_opacity : (typeof (event as any).section_visibility?.rsvp_style?.bg_opacity === "number" ? (event as any).section_visibility?.rsvp_style?.bg_opacity : (typeof (templateDefaults as any)?.rsvp_bg_opacity === "number" ? (templateDefaults as any)?.rsvp_bg_opacity : (typeof (templateDefaults as any)?.rsvp_style?.bg_opacity === "number" ? (templateDefaults as any)?.rsvp_style?.bg_opacity : null))))}
      headerFont={(event as any).rsvp_header_font ?? (event as any).section_visibility?.rsvp_header_font ?? (event as any).section_visibility?.rsvp_style?.header_font ?? (templateDefaults as any)?.rsvp_header_font ?? (templateDefaults as any)?.rsvp_style?.header_font ?? null}
      headerFontEn={(event as any).rsvp_header_font_en ?? (event as any).section_visibility?.rsvp_header_font_en ?? (event as any).section_visibility?.rsvp_style?.header_font_en ?? (templateDefaults as any)?.rsvp_header_font_en ?? (templateDefaults as any)?.rsvp_style?.header_font_en ?? null}
      bodyFont={(event as any).rsvp_body_font ?? (event as any).section_visibility?.rsvp_body_font ?? (event as any).section_visibility?.rsvp_style?.body_font ?? (templateDefaults as any)?.rsvp_body_font ?? (templateDefaults as any)?.rsvp_style?.body_font ?? null}
      bodyFontEn={(event as any).rsvp_body_font_en ?? (event as any).section_visibility?.rsvp_body_font_en ?? (event as any).section_visibility?.rsvp_style?.body_font_en ?? (templateDefaults as any)?.rsvp_body_font_en ?? (templateDefaults as any)?.rsvp_style?.body_font_en ?? null}
      headerEffect={(event as any).rsvp_header_effect ?? (event as any).section_visibility?.rsvp_header_effect ?? (event as any).section_visibility?.rsvp_style?.header_effect ?? (templateDefaults as any)?.rsvp_header_effect ?? (templateDefaults as any)?.rsvp_style?.header_effect ?? null}
      headerEffectColor={(event as any).rsvp_header_effect_color ?? (event as any).section_visibility?.rsvp_header_effect_color ?? (event as any).section_visibility?.rsvp_style?.header_effect_color ?? (templateDefaults as any)?.rsvp_header_effect_color ?? (templateDefaults as any)?.rsvp_style?.header_effect_color ?? null}
      headerEffectBlur={typeof (event as any).rsvp_header_effect_blur === "number" ? (event as any).rsvp_header_effect_blur : (typeof (event as any).section_visibility?.rsvp_header_effect_blur === "number" ? (event as any).section_visibility?.rsvp_header_effect_blur : (typeof (event as any).section_visibility?.rsvp_style?.header_effect_blur === "number" ? (event as any).section_visibility?.rsvp_style?.header_effect_blur : (typeof (templateDefaults as any)?.rsvp_header_effect_blur === "number" ? (templateDefaults as any)?.rsvp_header_effect_blur : (typeof (templateDefaults as any)?.rsvp_style?.header_effect_blur === "number" ? (templateDefaults as any)?.rsvp_style?.header_effect_blur : null))))}
      headerEffectX={typeof (event as any).rsvp_header_effect_x === "number" ? (event as any).rsvp_header_effect_x : (typeof (event as any).section_visibility?.rsvp_header_effect_x === "number" ? (event as any).section_visibility?.rsvp_header_effect_x : (typeof (event as any).section_visibility?.rsvp_style?.header_effect_x === "number" ? (event as any).section_visibility?.rsvp_style?.header_effect_x : (typeof (templateDefaults as any)?.rsvp_header_effect_x === "number" ? (templateDefaults as any)?.rsvp_header_effect_x : (typeof (templateDefaults as any)?.rsvp_style?.header_effect_x === "number" ? (templateDefaults as any)?.rsvp_style?.header_effect_x : null))))}
      headerEffectY={typeof (event as any).rsvp_header_effect_y === "number" ? (event as any).rsvp_header_effect_y : (typeof (event as any).section_visibility?.rsvp_header_effect_y === "number" ? (event as any).section_visibility?.rsvp_header_effect_y : (typeof (event as any).section_visibility?.rsvp_style?.header_effect_y === "number" ? (event as any).section_visibility?.rsvp_style?.header_effect_y : (typeof (templateDefaults as any)?.rsvp_header_effect_y === "number" ? (templateDefaults as any)?.rsvp_header_effect_y : (typeof (templateDefaults as any)?.rsvp_style?.header_effect_y === "number" ? (templateDefaults as any)?.rsvp_style?.header_effect_y : null))))}
      headerEffectOpacity={typeof (event as any).rsvp_header_effect_opacity === "number" ? (event as any).rsvp_header_effect_opacity : (typeof (event as any).section_visibility?.rsvp_header_effect_opacity === "number" ? (event as any).section_visibility?.rsvp_header_effect_opacity : (typeof (event as any).section_visibility?.rsvp_style?.header_effect_opacity === "number" ? (event as any).section_visibility?.rsvp_style?.header_effect_opacity : (typeof (templateDefaults as any)?.rsvp_header_effect_opacity === "number" ? (templateDefaults as any)?.rsvp_header_effect_opacity : (typeof (templateDefaults as any)?.rsvp_style?.header_effect_opacity === "number" ? (templateDefaults as any)?.rsvp_style?.header_effect_opacity : null))))}
      cardShadowType={(event as any).rsvp_card_shadow_type ?? (event as any).section_visibility?.rsvp_card_shadow_type ?? (event as any).section_visibility?.rsvp_style?.card_shadow_type ?? (templateDefaults as any)?.rsvp_card_shadow_type ?? (templateDefaults as any)?.rsvp_style?.card_shadow_type ?? null}
      cardShadowColor={(event as any).rsvp_card_shadow_color ?? (event as any).section_visibility?.rsvp_card_shadow_color ?? (event as any).section_visibility?.rsvp_style?.card_shadow_color ?? (templateDefaults as any)?.rsvp_card_shadow_color ?? (templateDefaults as any)?.rsvp_style?.card_shadow_color ?? null}
      cardShadowBlur={typeof (event as any).rsvp_card_shadow_blur === "number" ? (event as any).rsvp_card_shadow_blur : (typeof (event as any).section_visibility?.rsvp_card_shadow_blur === "number" ? (event as any).section_visibility?.rsvp_card_shadow_blur : (typeof (event as any).section_visibility?.rsvp_style?.card_shadow_blur === "number" ? (event as any).section_visibility?.rsvp_style?.card_shadow_blur : (typeof (templateDefaults as any)?.rsvp_card_shadow_blur === "number" ? (templateDefaults as any)?.rsvp_card_shadow_blur : (typeof (templateDefaults as any)?.rsvp_style?.card_shadow_blur === "number" ? (templateDefaults as any)?.rsvp_style?.card_shadow_blur : null))))}
      cardShadowSpread={typeof (event as any).rsvp_card_shadow_spread === "number" ? (event as any).rsvp_card_shadow_spread : (typeof (event as any).section_visibility?.rsvp_card_shadow_spread === "number" ? (event as any).section_visibility?.rsvp_card_shadow_spread : (typeof (event as any).section_visibility?.rsvp_style?.card_shadow_spread === "number" ? (event as any).section_visibility?.rsvp_style?.card_shadow_spread : (typeof (templateDefaults as any)?.rsvp_card_shadow_spread === "number" ? (templateDefaults as any)?.rsvp_card_shadow_spread : (typeof (templateDefaults as any)?.rsvp_style?.card_shadow_spread === "number" ? (templateDefaults as any)?.rsvp_style?.card_shadow_spread : null))))}
      cardShadowX={typeof (event as any).rsvp_card_shadow_x === "number" ? (event as any).rsvp_card_shadow_x : (typeof (event as any).section_visibility?.rsvp_card_shadow_x === "number" ? (event as any).section_visibility?.rsvp_card_shadow_x : (typeof (event as any).section_visibility?.rsvp_style?.card_shadow_x === "number" ? (event as any).section_visibility?.rsvp_style?.card_shadow_x : (typeof (templateDefaults as any)?.rsvp_card_shadow_x === "number" ? (templateDefaults as any)?.rsvp_card_shadow_x : (typeof (templateDefaults as any)?.rsvp_style?.card_shadow_x === "number" ? (templateDefaults as any)?.rsvp_style?.card_shadow_x : null))))}
      cardShadowY={typeof (event as any).rsvp_card_shadow_y === "number" ? (event as any).rsvp_card_shadow_y : (typeof (event as any).section_visibility?.rsvp_card_shadow_y === "number" ? (event as any).section_visibility?.rsvp_card_shadow_y : (typeof (event as any).section_visibility?.rsvp_style?.card_shadow_y === "number" ? (event as any).section_visibility?.rsvp_style?.card_shadow_y : (typeof (templateDefaults as any)?.rsvp_card_shadow_y === "number" ? (templateDefaults as any)?.rsvp_card_shadow_y : (typeof (templateDefaults as any)?.rsvp_style?.card_shadow_y === "number" ? (templateDefaults as any)?.rsvp_style?.card_shadow_y : null))))}
      cardShadowOpacity={typeof (event as any).rsvp_card_shadow_opacity === "number" ? (event as any).rsvp_card_shadow_opacity : (typeof (event as any).section_visibility?.rsvp_card_shadow_opacity === "number" ? (event as any).section_visibility?.rsvp_card_shadow_opacity : (typeof (event as any).section_visibility?.rsvp_style?.card_shadow_opacity === "number" ? (event as any).section_visibility?.rsvp_style?.card_shadow_opacity : (typeof (templateDefaults as any)?.rsvp_card_shadow_opacity === "number" ? (templateDefaults as any)?.rsvp_card_shadow_opacity : (typeof (templateDefaults as any)?.rsvp_style?.card_shadow_opacity === "number" ? (templateDefaults as any)?.rsvp_style?.card_shadow_opacity : null))))}
      language={language}
      onSubmit={(s, p, m, gName) => {
        setPartySize(p);
        setMessage(m);
        submit(s, p, m, gName);
      }}
    />
  );

  const musicSettings = normalizeMusicSettings({
    autoPlayCover:
      (event as any).music_autoplay_cover ??
      (event as any).section_visibility?.music_autoplay_cover ??
      templateDefaults.music_autoplay_cover ??
      (templateVisibility as any)?.music_autoplay_cover,
    autoPlayInvitation:
      (event as any).music_autoplay_invitation ??
      (event as any).section_visibility?.music_autoplay_invitation ??
      templateDefaults.music_autoplay_invitation ??
      (templateVisibility as any)?.music_autoplay_invitation,
    music_autoplay_mode:
      (event as any).music_autoplay_mode ??
      (event as any).section_visibility?.music_autoplay_mode ??
      templateDefaults.music_autoplay_mode ??
      (templateVisibility as any)?.music_autoplay_mode,
  });

  const envelopeConfig = normalizeEnvelopeConfig(
    (event as any).envelope_unboxing ??
    (event as any).section_visibility?.envelope_unboxing ??
    templateDefaults.envelope_unboxing ??
    (templateVisibility as any)?.envelope_unboxing
  );

  const coverInvitationStyle = normalizeCoverInvitationStyle(
    (event as any).cover_invitation_style ??
    (event as any).section_visibility?.cover_invitation_style ??
    (event as any).section_visibility?.cover_invitation ??
    (templateDefaults as any)?.cover_invitation_style ??
    (templateVisibility as any)?.cover_invitation_style
  );

  const guestNameStyle = normalizeGuestNameStyle(
    (event as any).guest_name_style ??
    (event as any).section_visibility?.guest_name_style ??
    templateDefaults.guest_name_style ??
    (templateVisibility as any)?.guest_name_style
  );

  const shouldDisableAutoPlay = isCoverActive
    ? !musicSettings.autoPlayCover
    : !musicSettings.autoPlayInvitation;

  const handleOpenInvitation = () => {
    // Unlock scrolling immediately on click
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.style.touchAction = "";
    setOpened(true);
    if (envelopeConfig.enabled) {
      setUnboxingActive(true);
    }
    if (musicSettings.autoPlayInvitation || musicSettings.autoPlayCover) {
      setMusicPlayTrigger((n) => n + 1);
    }
  };

  const handleUnboxingComplete = () => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.style.touchAction = "";
    setUnboxingActive(false);
    if (musicSettings.autoPlayInvitation || musicSettings.autoPlayCover) {
      setMusicPlayTrigger((n) => n + 1);
    }
  };

  const musicUrl = (event as any).cover_music_url ?? templateDefaults.cover_music_url ?? null;
  const isMusicVisible =
    (event as any).section_visibility?.background_music !== false &&
    (templateVisibility as any)?.background_music !== false &&
    !!musicUrl &&
    typeof musicUrl === "string" &&
    !!musicUrl.trim();
  const accentColor = (event as any).text_color_accent ?? "#db9b0f";
  const contactList = (event as any).contacts ? (Array.isArray((event as any).contacts) ? (event as any).contacts : []) : [];
  const hasBottomContact =
    opened &&
    (event as any).section_visibility?.floating_contact !== false &&
    (templateVisibility as any)?.floating_contact !== false &&
    (contactList.length > 0 || !!(event as any).contact_phone);

  return (
    <ErrorBoundary fallbackTitle="Unable to load invitation">
      <div
        className="invitation-surface min-h-screen relative bg-[#fdf5dc]"
        style={{
          minHeight: "100vh",
          maxHeight: isCoverActive ? "100vh" : undefined,
          overflow: isCoverActive ? "hidden" : undefined,
        }}
      >
        {/* Base layer: The live invitation template is rendered underneath */}
        <div
          style={{
            pointerEvents: isCoverActive ? "none" : undefined,
          }}
        >
          <InvitationTemplate
            template={event.template}
            event={event}
            guestName={activeGuest.name}
            eventVisibility={(event as any).section_visibility}
            templateVisibility={templateVisibility}
            templateDefaults={templateDefaults}
            language={language}
            onLanguageChange={setLanguage}
            hideFloatingMusic={true}
            hideFloatingLanguageSwitch={true}
          >
            {rsvpForm}
          </InvitationTemplate>
        </div>

        {/* Original Cover for Khmer Traditional / Essentials — completely untouched */}
        {isEssentials && isCoverActive && (
          <div
            className={`fixed inset-0 z-40 h-[100dvh] min-h-screen w-full overflow-hidden transition-opacity duration-300 ${
              unboxingActive ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={() => {
              if (musicSettings.autoPlayCover) {
                setMusicPlayTrigger((n) => n + 1);
              }
            }}
          >
            <KhmerTraditionalCover
              guestName={activeGuest.name}
              title={language === "en" ? (((event as any).dual_language_config?.en?.title || (event as any).section_visibility?.dual_language?.en?.title) ?? event.title) : event.title}
              coupleTitleEn={
                (event as any).dual_language_config?.en?.groom_name && (event as any).dual_language_config?.en?.bride_name
                  ? `${(event as any).dual_language_config.en.groom_name} & ${(event as any).dual_language_config.en.bride_name}`
                  : ((event as any).dual_language_config?.en?.title || (event as any).section_visibility?.dual_language?.en?.title || null)
              }
              backgroundUrl={(event as any).cover_background_url ?? null}
              nameGraphicUrl={
                language === "en"
                  ? ((event as any).cover_image_url_en ?? null)
                  : ((event as any).cover_image_url ?? templateDefaults.cover_image_url ?? null)
              }
              accentColor={(event as any).text_color_accent ?? null}
              openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? (templateDefaults as any)?.open_button_color ?? null}
              language={language}
              monogramEffectConfig={(event as any).text_effect_config ?? (event as any).section_visibility?.text_effects ?? templateDefaults.text_effect_config ?? null}
              coverInvitationStyle={coverInvitationStyle}
              guestNameStyle={guestNameStyle}
              onOpen={handleOpenInvitation}
            />
          </div>
        )}

        {/* Original Cover for Signature Package — completely untouched */}
        {isSignature && isCoverActive && (
          <div
            className={`transition-opacity duration-300 ${
              unboxingActive ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={() => {
              if (musicSettings.autoPlayCover) {
                setMusicPlayTrigger((n) => n + 1);
              }
            }}
          >
            <SignaturePackageCover
              guestName={activeGuest.name}
              title={language === "en" ? (((event as any).dual_language_config?.en?.title || (event as any).section_visibility?.dual_language?.en?.title) ?? event.title) : event.title}
              backgroundUrl={(event as any).cover_background_url ?? null}
              frameUrl={(event as any).frame_url ?? templateDefaults.frame_url ?? null}
              frameType={((event as any).frame_type ?? templateDefaults.frame_type ?? "image") as "image" | "video"}
              accentColor={(event as any).text_color_accent ?? null}
              openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? (templateDefaults as any)?.open_button_color ?? null}
              language={language}
              monogramEffectConfig={(event as any).text_effect_config ?? (event as any).section_visibility?.text_effects ?? templateDefaults.text_effect_config ?? null}
              coverInvitationStyle={coverInvitationStyle}
              guestNameStyle={guestNameStyle}
              onOpen={handleOpenInvitation}
              closing={opened || unboxingActive}
            />
          </div>
        )}

        {/* 3D Envelope Unboxing Animation Overlay (Only plays when guest clicks Open Invitation) */}
        {envelopeConfig.enabled && unboxingActive && (
          <Interactive3DEnvelopeUnboxing
            config={envelopeConfig}
            guestName={activeGuest.name}
            title={language === "en" ? (((event as any).dual_language_config?.en?.title || (event as any).section_visibility?.dual_language?.en?.title) ?? event.title) : event.title}
            language={language}
            accentColor={accentColor}
            coverBackgroundUrl={(event as any).cover_background_url ?? null}
            monogramGraphicUrl={
              language === "en"
                ? ((event as any).cover_image_url_en ?? (event as any).cover_image_url ?? templateDefaults.cover_image_url ?? null)
                : ((event as any).cover_image_url ?? templateDefaults.cover_image_url ?? null)
            }
            onComplete={handleUnboxingComplete}
          />
        )}

        {/* Floating Controls at bottom-right (Music on top, Language switch below):
            Active on BOTH cover and invitation page so guests can hear/control music immediately! */}
        {(isMusicVisible || dualCfg.enabled) && (
          <div
            className={`fixed ${
              hasBottomContact
                ? "bottom-24 right-5 sm:bottom-28 sm:right-6"
                : "bottom-5 right-5 sm:bottom-6 sm:right-6"
            } z-[9999] flex flex-col items-center gap-2 pointer-events-none select-none`}
          >
            {isMusicVisible && (
              <div className="pointer-events-auto">
                <FloatingMusicPlayer
                  musicUrl={musicUrl}
                  accentColor={accentColor}
                  position="bottom-right"
                  positionMode="inline"
                  disableAutoPlay={shouldDisableAutoPlay}
                  playTrigger={musicPlayTrigger}
                />
              </div>
            )}
            {dualCfg.enabled && (
              <div className="pointer-events-auto">
                <FloatingLanguageSwitch
                  language={language}
                  onLanguageChange={setLanguage}
                  accentColor={accentColor}
                  positionMode="inline"
                />
              </div>
            )}
          </div>
        )}

        {/* Same guest name confirmation dialog */}
        <AlertDialog open={Boolean(duplicatePending)} onOpenChange={(open) => { if (!open) setDuplicatePending(null); }}>
          <AlertDialogContent className="max-w-md w-[92vw] rounded-2xl p-6 border-gold/40 shadow-2xl bg-white dark:bg-zinc-900 text-foreground">
            <AlertDialogHeader className="text-center sm:text-left space-y-3">
              <div className="mx-auto sm:mx-0 h-12 w-12 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="font-serif text-xl sm:text-2xl text-foreground">
                {language === "en" ? "Did you already submit an RSVP?" : "តើលោកអ្នកធ្លាប់បានឆ្លើយតបរួចហើយមែនទេ?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
                <div>
                  {language === "en" ? (
                    <>
                      We found an existing response for <strong className="text-foreground">"{duplicatePending?.submittedName}"</strong>:
                    </>
                  ) : (
                    <>
                      យើងខ្ញុំបានរកឃើញឈ្មោះ <strong className="text-foreground">"{duplicatePending?.submittedName}"</strong> ធ្លាប់បានឆ្លើយតបរួចហើយ៖
                    </>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 text-xs text-foreground text-left space-y-1">
                  <div>
                    <span className="text-muted-foreground">{language === "en" ? "Status:" : "ស្ថានភាព៖"}</span>{" "}
                    <strong className={duplicatePending?.matchedGuest?.rsvp_status === "yes" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                      {duplicatePending?.matchedGuest?.rsvp_status === "yes"
                        ? (language === "en" ? "Joyfully Attending" : "យល់ព្រមចូលរួម")
                        : (language === "en" ? "Declined" : "មិនអាចចូលរួម")}
                    </strong>
                  </div>
                  {duplicatePending?.matchedGuest?.rsvp_status === "yes" && (
                    <div>
                      <span className="text-muted-foreground">{language === "en" ? "Party Size:" : "ចំនួនភ្ញៀវ៖"}</span>{" "}
                      <strong>{duplicatePending?.matchedGuest?.party_size} {language === "en" ? "Guests" : "នាក់"}</strong>
                    </div>
                  )}
                  {duplicatePending?.matchedGuest?.message && (
                    <div className="italic text-muted-foreground text-[11px] truncate">
                      "{duplicatePending?.matchedGuest?.message}"
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  {language === "en"
                    ? "Is this you updating your previous response, or are you a different guest with the same name?"
                    : "តើនេះជាលោកអ្នកចង់កែប្រែការឆ្លើយតបពីមុន ឬជាភ្ញៀវថ្មីដែលមានឈ្មោះដូចគ្នា?"}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleConfirmDuplicateNo}
                className="w-full sm:w-auto text-xs order-2 sm:order-1"
              >
                {language === "en" ? "No, I'm a new guest (Add new data)" : "មិនមែនទេ ខ្ញុំជាភ្ញៀវថ្មី (បង្កើតថ្មី)"}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDuplicateYes}
                className="w-full sm:w-auto text-xs text-white order-1 sm:order-2"
                style={{ background: accentColor }}
              >
                {language === "en" ? "Yes, update my response" : "បាទ/ចាស ខ្ញុំចង់កែប្រែ (Update)"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}
