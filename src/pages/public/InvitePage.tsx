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
import { normalizeMusicSettings } from "@/lib/musicSettings";
import { normalizeEnvelopeConfig } from "@/lib/envelopeUnboxing";
import { normalizeCoverInvitationStyle } from "@/lib/coverInvitationStyle";
import Interactive3DEnvelopeUnboxing from "@/components/templates/Interactive3DEnvelopeUnboxing";
import ErrorBoundary from "@/components/common/ErrorBoundary";

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

  // Prevent background scrolling and rubber-band peek-through on iOS/Safari ONLY while the cover is active
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
      const origTouch = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origDocOverflow;
        document.body.style.touchAction = origTouch;
      };
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
  }, [isCoverActive]);

  useEffect(() => {
    if (!slug || !token) { setLoading(false); return; }
    (async () => {
      const [evResponse, guestResponse] = await Promise.all([
        supabase.rpc("get_event_public_by_slug", { _slug: slug }),
        isPreview
          ? Promise.resolve({ data: null, error: null })
          : supabase.rpc("get_guest_by_token", { _event_slug: slug, _token: token }),
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
      if (dualCfg.default_language) {
        setLanguage(dualCfg.default_language);
      }

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
      } else if (guestResponse.data) {
        const gRows = guestResponse.data;
        const g = Array.isArray(gRows) ? gRows[0] : gRows;
        if (g) {
          setGuest(g as Guest);
          setPartySize(g.party_size);
          setMessage(g.message ?? "");
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
      setLoading(false);
    })();
  }, [slug, token, isPreview]);

  const submit = async (status: "yes" | "no") => {
    if (!slug || !token) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_rsvp", {
      _event_slug: slug,
      _token: token,
      _status: status,
      _party_size: partySize,
      _message: message || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      setGuest(data as Guest);
      toast.success(status === "yes" ? "Thank you for accepting 💛" : "Your response has been recorded");
    }
  };

  if (loading) {
    return (
      <div className="invitation-surface min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading invitation…</div>
      </div>
    );
  }

  if (!token || !event || !guest) {
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
      guestName={guest.name}
      status={guest.rsvp_status}
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
      onSubmit={(s, p, m) => {
        setPartySize(p);
        setMessage(m);
        submit(s);
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

  const shouldDisableAutoPlay = isCoverActive
    ? !musicSettings.autoPlayCover
    : !musicSettings.autoPlayInvitation;

  const handleOpenInvitation = () => {
    if (envelopeConfig.enabled) {
      setUnboxingActive(true);
    } else {
      setOpened(true);
    }
    if (musicSettings.autoPlayInvitation || musicSettings.autoPlayCover) {
      setMusicPlayTrigger((n) => n + 1);
    }
  };

  const handleUnboxingComplete = () => {
    setOpened(true);
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
            visibility: isCoverActive && !unboxingActive ? "hidden" : "visible",
          }}
        >
          <InvitationTemplate
            template={event.template}
            event={event}
            guestName={guest.name}
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
              guestName={guest.name}
              title={event.title}
              backgroundUrl={(event as any).cover_background_url ?? null}
              nameGraphicUrl={(event as any).cover_image_url ?? templateDefaults.cover_image_url ?? null}
              accentColor={(event as any).text_color_accent ?? null}
              openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? (templateDefaults as any)?.open_button_color ?? null}
              language={language}
              monogramEffectConfig={(event as any).text_effect_config ?? (event as any).section_visibility?.text_effects ?? templateDefaults.text_effect_config ?? null}
              coverInvitationStyle={coverInvitationStyle}
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
              guestName={guest.name}
              title={event.title}
              backgroundUrl={(event as any).cover_background_url ?? null}
              frameUrl={(event as any).frame_url ?? templateDefaults.frame_url ?? null}
              frameType={((event as any).frame_type ?? templateDefaults.frame_type ?? "image") as "image" | "video"}
              accentColor={(event as any).text_color_accent ?? null}
              openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? (templateDefaults as any)?.open_button_color ?? null}
              language={language}
              monogramEffectConfig={(event as any).text_effect_config ?? (event as any).section_visibility?.text_effects ?? templateDefaults.text_effect_config ?? null}
              coverInvitationStyle={coverInvitationStyle}
              onOpen={handleOpenInvitation}
              closing={opened || unboxingActive}
            />
          </div>
        )}

        {/* 3D Envelope Unboxing Animation Overlay (Only plays when guest clicks Open Invitation) */}
        {envelopeConfig.enabled && unboxingActive && (
          <Interactive3DEnvelopeUnboxing
            config={envelopeConfig}
            guestName={guest.name}
            title={event.title}
            language={language}
            accentColor={accentColor}
            coverBackgroundUrl={(event as any).cover_background_url ?? null}
            monogramGraphicUrl={(event as any).cover_image_url ?? templateDefaults.cover_image_url ?? null}
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
      </div>
    </ErrorBoundary>
  );
}
