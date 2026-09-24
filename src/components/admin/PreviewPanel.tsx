import { useEffect, useRef, useState } from "react";
import { Smartphone, Tablet, Monitor, ExternalLink, RefreshCw, Music, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvitationTemplate, type TemplateData } from "@/components/templates/InvitationTemplate";
import RsvpCard from "@/components/templates/RsvpCard";
import SignaturePackageCover from "@/components/templates/SignaturePackageCover";
import KhmerTraditionalCover from "@/components/templates/KhmerTraditionalCover";
import FloatingMusicPlayer from "@/components/templates/FloatingMusicPlayer";
import FloatingLanguageSwitch from "@/components/templates/FloatingLanguageSwitch";
import OrnamentalSideFrame from "@/components/templates/OrnamentalSideFrame";
import { normalizeSideFrameConfig } from "@/lib/sideFrame";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import { getDualLanguageConfig, LanguageCode } from "@/lib/dualLanguage";
import { normalizeMusicSettings } from "@/lib/musicSettings";
import { normalizeTextEffectConfig } from "@/lib/textEffects";
import ErrorBoundary from "@/components/common/ErrorBoundary";

type Device = "mobile" | "tablet" | "desktop";

const SIZES: Record<Device, { w: number; h: number; label: string; Icon: typeof Smartphone }> = {
  mobile: { w: 430, h: 932, label: "Mobile", Icon: Smartphone },
  tablet: { w: 820, h: 1100, label: "Tablet", Icon: Tablet },
  desktop: { w: 1440, h: 820, label: "Desktop", Icon: Monitor },
};

type Props = {
  event: TemplateData & { template: string; slug?: string | null };
  guestName?: string;
  publicHref?: string | null;
  defaultOpen?: boolean;
  /** Render without the outer collapsible card (caller provides its own framing). */
  bare?: boolean;
};

/**
 * PreviewPanel — live preview of the invitation as guests will see it.
 *
 * Wrapped in a Chrome-style frame (traffic-light dots + URL pill). The
 * device viewport is rendered at its true pixel size and then `transform:
 * scale()`-ed so it always fits the available container width while
 * preserving each device's aspect ratio (no horizontal scroll, no
 * letterboxing). Internal scrollbars are hidden so it looks like a real
 * device tab.
 */
export default function PreviewPanel({
  event,
  guestName = "ភ្ញៀវកិត្តិយស",
  publicHref,
  defaultOpen = true,
  bare = false,
}: Props) {
  const [device, setDevice] = useState<Device>("mobile");
  const [bump, setBump] = useState(0); // re-mount key to fully reset scroll/state
  const size = SIZES[device];

  // Cover-screen support: signature-package, khmer-traditional and the
  // essentials-package all show a gate cover before the invitation. The
  // admin can toggle between Cover and Invitation to confirm legibility.
  const isSignature = event.template === "signature-package-01";
  const hasKhmerCover =
    event.template === "khmer-traditional" ||
    event.template === "essentials-package-01" ||
    event.template === "essentials-package";
  const hasCover = isSignature || hasKhmerCover;
  const [view, setView] = useState<"cover" | "invitation">(hasCover ? "cover" : "invitation");
  const opened = view === "invitation";
  const setOpened = (v: boolean) => setView(v ? "invitation" : "cover");
  // Reset to cover whenever the user resets the preview, switches device, or
  // changes template.
  useEffect(() => {
    setView(hasCover ? "cover" : "invitation");
  }, [bump, device, event.template, hasCover]);

  // Branded preview URL: 21invite.online/<slug>/invite?token=preview
  const slug = event.slug ?? "your-event";
  const url = `21invite.online/${slug}/invite?token=preview`;

  // Auto-fit: measure the wrapper width and compute a scale so the device
  // viewport always fits horizontally while preserving its aspect ratio.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const recompute = () => {
      const available = el.clientWidth - 16; // small padding
      const s = Math.min(1, available / size.w);
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [size.w]);

  const scaledW = size.w * scale;
  const scaledH = size.h * scale;

  // Resolve the invite background the same way the template does so the
  // device frame paints a static background that matches the live page.
  const DEFAULT_KT_BG = "/templates/khmer-traditional/background.webp";
  const inviteBg =
    (event as any).invite_background_url ||
    (event as any).cover_background_url ||
    DEFAULT_KT_BG;

  // Resolve background music track (event-level override or template fallback)
  const musicUrl =
    (event as any).cover_music_url ??
    (event as any).template_cover_music_url ??
    (event as any).templateDefaults?.cover_music_url ??
    null;
  const isMusicVisible =
    (event as any).section_visibility?.background_music !== false &&
    !!musicUrl &&
    typeof musicUrl === "string" &&
    !!musicUrl.trim();

  const musicSettings = normalizeMusicSettings({
    autoPlayCover:
      (event as any).music_autoplay_cover ??
      (event as any).section_visibility?.music_autoplay_cover ??
      (event as any).template_section_visibility?.music_autoplay_cover,
    autoPlayInvitation:
      (event as any).music_autoplay_invitation ??
      (event as any).section_visibility?.music_autoplay_invitation ??
      (event as any).template_section_visibility?.music_autoplay_invitation,
    music_autoplay_mode:
      (event as any).music_autoplay_mode ??
      (event as any).section_visibility?.music_autoplay_mode ??
      (event as any).template_section_visibility?.music_autoplay_mode,
  });

  // Dual language configuration & active preview language
  const dualCfg = getDualLanguageConfig(
    (event as any).dual_language_config ??
    (event as any).section_visibility?.dual_language ??
    (event as any).section_visibility,
    event
  );

  const sideFrameCfg = normalizeSideFrameConfig(
    (event as any).side_frame_config ??
    (event as any).section_visibility?.side_frame_config ??
    (event as any).section_visibility?.side_frame
  );
  const [language, setLanguage] = useState<LanguageCode>(dualCfg.default_language ?? "km");

  useEffect(() => {
    setLanguage(dualCfg.default_language ?? "km");
  }, [dualCfg.default_language, bump]);

  const body = (
    <div className="pt-2 space-y-4">
      {/* Device toolbar */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {(Object.keys(SIZES) as Device[]).map((d) => {
          const { Icon, label } = SIZES[d];
          const active = d === device;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors ${
                active
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          );
        })}
      </div>

      {/* Cover/Invitation view toggle — only shown for templates with a cover gate */}
      {hasCover && (
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
            {(["cover", "invitation"] as const).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {v === "cover" ? "Cover" : "Invitation"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Browser-tab style frame, auto-scaled to fit */}
      <div ref={wrapRef} className="w-full">
        <div
          className="mx-auto rounded-xl border border-border bg-secondary/50 shadow-soft overflow-hidden"
          style={{ width: scaledW }}
        >
          {/* Chrome-like top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/70">
            <div className="flex items-center gap-1.5">
              <span className="block h-3 w-3 rounded-full" style={{ background: "hsl(0 70% 60%)" }} />
              <span className="block h-3 w-3 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />
              <span className="block h-3 w-3 rounded-full" style={{ background: "hsl(140 50% 50%)" }} />
            </div>
            <div className="flex-1 mx-2 h-6 rounded-full bg-background border border-border flex items-center px-3 text-[11px] text-muted-foreground truncate">
              {url}
            </div>
            {isMusicVisible && (
              <span
                title={`Background music: ${
                  musicSettings.autoPlayCover && musicSettings.autoPlayInvitation
                    ? "Autoplay on cover and invitation"
                    : musicSettings.autoPlayCover
                    ? "Autoplay on cover only"
                    : musicSettings.autoPlayInvitation
                    ? "Autoplay on invitation only"
                    : "Autoplay disabled (manual tap only)"
                }`}
                className="inline-flex items-center gap-1 text-[10px] text-gold font-medium px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 shrink-0"
              >
                <Music className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">
                  {musicSettings.autoPlayCover && musicSettings.autoPlayInvitation
                    ? "Music (Cover & Invite)"
                    : musicSettings.autoPlayCover
                    ? "Music (Cover Only)"
                    : musicSettings.autoPlayInvitation
                    ? "Music (Invite Only)"
                    : "Music (Manual)"}
                </span>
              </span>
            )}
            {dualCfg.enabled && (
              <div className="inline-flex items-center gap-1 bg-background/90 border border-gold/40 rounded-full px-1.5 py-0.5 text-[10px] shrink-0 shadow-2xs">
                <Globe className="h-2.5 w-2.5 text-gold" />
                <button
                  type="button"
                  onClick={() => setLanguage("km")}
                  className={`px-1.5 py-0.5 rounded-full font-bold transition-all ${
                    language === "km" ? "bg-gold text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Preview Khmer version"
                >
                  KM
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-1.5 py-0.5 rounded-full font-bold transition-all ${
                    language === "en" ? "bg-gold text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Preview English version"
                >
                  EN
                </button>
              </div>
            )}
          </div>

          {/* Scaled viewport — true device pixels, transformed to fit. The
              outer wrapper paints a static background (mirroring the real
              invite page where the bg is `position: fixed`), and the inner
              scrollable element renders only the content on top. This way
              the background stays put while the content scrolls — just like
              a real browser tab. */}
          <div
            className="bg-background mx-auto relative overflow-hidden"
            style={{ width: scaledW, height: scaledH }}
          >
            {/* Static background layer for the device frame */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${inviteBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#fdf5dc",
                zIndex: 0,
              }}
            />
            <div
              key={bump}
              className="preview-viewport relative"
              style={{
                width: size.w,
                height: size.h,
                overflowY: "auto",
                overflowX: "hidden",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                zIndex: 1,
              }}
            >
              <InvitationTemplate
                template={event.template}
                event={event}
                guestName={guestName}
                hideBackground
                hideFloatingContact
                hideFloatingMusic
                hideFloatingLanguageSwitch
                language={language}
                onLanguageChange={setLanguage}
                eventVisibility={(event as any).section_visibility}
                templateVisibility={(event as any).template_section_visibility}
              >
                <RsvpCard
                  guestName={guestName}
                  preview
                  accentColor={(event as any).text_color_accent ?? undefined}
                  primaryColor={(event as any).text_color_primary ?? undefined}
                />
              </InvitationTemplate>
            </div>

            {/* Pinned Ornamental Side Frame — stays fixed to device frame while content scrolls */}
            {sideFrameCfg.enabled && (
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: size.w,
                  height: size.h,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  zIndex: 2,
                }}
              >
                <OrnamentalSideFrame
                  config={sideFrameCfg}
                  accentColor={(event as any).text_color_accent}
                  positionMode="absolute"
                />
              </div>
            )}

            {/* Signature Package cover gate — overlays the device frame at
                the same scaled size as the viewport. Tapping "Open" fades
                it out and reveals the invitation underneath, matching the
                live invite-page flow exactly. */}
            {isSignature && (
              <div
                key={`cover-${bump}`}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: size.w,
                  height: size.h,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  zIndex: 2,
                }}
              >
                <div className="relative w-full h-full pointer-events-auto">
                  <SignaturePackageCover
                    guestName={guestName}
                    title={(event as any).title ?? ""}
                    backgroundUrl={(event as any).cover_background_url ?? null}
                    musicUrl={musicUrl}
                    frameUrl={(event as any).frame_url ?? null}
                    frameType={((event as any).frame_type ?? "image") as "image" | "video"}
                    accentColor={(event as any).text_color_accent ?? null}
                    openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? null}
                    language={language}
                    monogramEffectConfig={
                      normalizeTextEffectConfig(
                        (event as any).text_effect_config ?? (event as any).section_visibility?.text_effects
                      ).monogram
                    }
                    onOpen={() => setOpened(true)}
                    closing={opened}
                    positionMode="absolute"
                  />
                </div>
              </div>
            )}

            {/* Khmer Traditional / Essentials cover gate — shown when
                the toggle is set to "Cover". Switches the entire view
                rather than fading like the signature package. */}
            {hasKhmerCover && view === "cover" && (
              <div
                key={`kt-cover-${bump}`}
                className="absolute top-0 left-0"
                style={{
                  width: size.w,
                  height: size.h,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  zIndex: 3,
                }}
              >
                <KhmerTraditionalCover
                  guestName={guestName}
                  title={(event as any).title ?? ""}
                  backgroundUrl={(event as any).cover_background_url ?? null}
                  nameGraphicUrl={(event as any).cover_image_url ?? (event as any).templateDefaults?.cover_image_url ?? null}
                  accentColor={(event as any).text_color_accent ?? null}
                  openButtonColor={(event as any).open_button_color ?? (event as any).section_visibility?.open_button_color ?? null}
                  language={language}
                  monogramEffectConfig={
                    normalizeTextEffectConfig(
                      (event as any).text_effect_config ?? (event as any).section_visibility?.text_effects
                    ).monogram
                  }
                  onOpen={() => setView("invitation")}
                />
              </div>
            )}

            {/* Floating controls in preview: Music note on top, Language Switch directly below it */}
            {((isMusicVisible && (!isSignature || opened)) || dualCfg.enabled) && (
              <div
                className="absolute bottom-4 right-4 z-40 flex flex-col items-center gap-2 pointer-events-none select-none"
              >
                {isMusicVisible && (!isSignature || opened) && (
                  <div className="pointer-events-auto">
                    <FloatingMusicPlayer
                      key={`preview-music-${bump}-${musicUrl}`}
                      musicUrl={musicUrl}
                      accentColor={(event as any).text_color_accent ?? "#db9b0f"}
                      position="bottom-right"
                      positionMode="inline"
                      disableAutoPlay
                    />
                  </div>
                )}
                {dualCfg.enabled && (
                  <div className="pointer-events-auto">
                    <FloatingLanguageSwitch
                      language={language}
                      onLanguageChange={setLanguage}
                      accentColor={(event as any).text_color_accent ?? "#db9b0f"}
                      positionMode="inline"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {size.label} — {size.w}×{size.h} {scale < 1 ? `(scaled to ${Math.round(scale * 100)}%)` : ""}.{" "}
        {hasCover
          ? (view === "cover"
              ? "Showing the cover (gate) screen — toggle to Invitation to verify the inside."
              : <>Showing the invitation. <button type="button" className="underline hover:text-gold" onClick={() => setView("cover")}>Back to cover</button></>)
          : "The cover (gate) screen is skipped — guests see it before this view."}
      </p>

      {/* Hide WebKit scrollbars inside preview without affecting the rest of the app. */}
      <style>{`.preview-viewport::-webkit-scrollbar{ width:0; height:0; display:none; }`}</style>
    </div>
  );

  if (bare) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="font-serif text-xl">Live preview</h2>
            <p className="text-xs text-muted-foreground mt-1">
              See how guests will view this invitation. Reflects your unsaved edits.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" size="sm" variant="ghost" onClick={() => setBump((n) => n + 1)} title="Reset preview">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {publicHref && (
              <a href={publicHref} target="_blank" rel="noreferrer">
                <Button type="button" size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open
                </Button>
              </a>
            )}
          </div>
        </div>
        <ErrorBoundary onReset={() => setBump((n) => n + 1)} fallbackTitle="Preview encountered an issue">
          {body}
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <CollapsibleSection
      title="Live preview"
      description="See how guests will view this invitation. Reflects your unsaved edits."
      defaultOpen={defaultOpen}
      rightSlot={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); setBump((n) => n + 1); }}
            title="Reset preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {publicHref && (
            <a href={publicHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <Button type="button" size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" /> Open
              </Button>
            </a>
          )}
        </div>
      }
    >
      <ErrorBoundary onReset={() => setBump((n) => n + 1)} fallbackTitle="Preview encountered an issue">
        {body}
      </ErrorBoundary>
    </CollapsibleSection>
  );
}
