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
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(isPreview);
  const [language, setLanguage] = useState<LanguageCode>("km");

  useEffect(() => {
    if (!slug || !token) { setLoading(false); return; }
    (async () => {
      const { data: evRows } = await supabase.rpc("get_event_public_by_slug", {
        _slug: slug,
      });
      const ev = Array.isArray(evRows) ? evRows[0] : evRows;
      if (!ev) { setLoading(false); return; }
      setEvent(ev as Event);
      const dualCfg = getDualLanguageConfig(
        (ev as any).dual_language_config ??
        (ev as any).section_visibility?.dual_language ??
        (ev as any).section_visibility,
        ev
      );
      if (dualCfg.default_language) {
        setLanguage(dualCfg.default_language);
      }
      // Pull the template's default section visibility so the merge in
      // <InvitationTemplate> can fall through to it when the event hasn't
      // overridden a given key.
      const { data: tpl } = await supabase
        .from("templates")
        .select("config")
        .eq("slug", (ev as any).template)
        .maybeSingle();
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
        frame_url: cfg.frame_url ?? null,
        frame_type: (cfg.frame_type as "image" | "video") ?? "image",
        cover_music_url: cfg.cover_music_url ?? null,
      });
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
      } else {
        // Use a SECURITY DEFINER RPC so anonymous visitors can only retrieve
        // the single guest matching their invitation token — never enumerate
        // the table.
        const { data: gRows } = await supabase.rpc("get_guest_by_token", {
          _event_slug: slug,
          _token: token,
        });
        const g = Array.isArray(gRows) ? gRows[0] : gRows;
        if (g) {
          setGuest(g as Guest);
          setPartySize(g.party_size);
          setMessage(g.message ?? "");
        }
      }
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
      language={language}
      onSubmit={(s, p, m) => {
        setPartySize(p);
        setMessage(m);
        submit(s);
      }}
    />
  );

  const isEssentials =
    event.template === "essentials-package-01" ||
    event.template === "essentials-package" ||
    event.template === "khmer-traditional";

  const isSignature = event.template === "signature-package-01";

  const musicUrl = (event as any).cover_music_url ?? templateDefaults.cover_music_url ?? null;
  const isMusicVisible =
    (event as any).section_visibility?.background_music !== false &&
    (templateVisibility as any)?.background_music !== false &&
    !!musicUrl &&
    !!musicUrl.trim();
  const accentColor = (event as any).text_color_accent ?? "#db9b0f";
  const contactList = (event as any).contacts ? (Array.isArray((event as any).contacts) ? (event as any).contacts : []) : [];
  const hasBottomContact =
    opened &&
    (event as any).section_visibility?.floating_contact !== false &&
    (templateVisibility as any)?.floating_contact !== false &&
    (contactList.length > 0 || !!(event as any).contact_phone);

  return (
    <div className="invitation-surface min-h-screen relative">
      {isEssentials && !opened ? (
        <div className="h-[100dvh] min-h-screen w-full overflow-hidden relative">
          <KhmerTraditionalCover
            guestName={guest.name}
            title={event.title}
            backgroundUrl={(event as any).cover_background_url ?? null}
            accentColor={(event as any).text_color_accent ?? null}
            language={language}
            onOpen={() => setOpened(true)}
          />
        </div>
      ) : (
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
      )}

      {isSignature && !isPreview && (
        <SignaturePackageCover
          guestName={guest.name}
          title={event.title}
          backgroundUrl={(event as any).cover_background_url ?? null}
          frameUrl={(event as any).frame_url ?? templateDefaults.frame_url ?? null}
          frameType={((event as any).frame_type ?? templateDefaults.frame_type ?? "image") as "image" | "video"}
          accentColor={(event as any).text_color_accent ?? null}
          language={language}
          onOpen={() => setOpened(true)}
          closing={opened}
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
  );
}
