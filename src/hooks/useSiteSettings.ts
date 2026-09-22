import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  logo_url: string | null;
  footer_text: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  telegram_url: string | null;
};

const DEFAULTS: SiteSettings = {
  logo_url: null,
  footer_text: "Invitation made with love by 21Invite.Online",
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  telegram_url: null,
};

/**
 * Read-only access to the site-wide settings singleton (logo, footer, socials).
 * Public — no auth required.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("logo_url, footer_text, facebook_url, instagram_url, tiktok_url, telegram_url")
        .eq("id", "global")
        .maybeSingle();
      if (!cancelled) {
        setSettings({ ...DEFAULTS, ...(data ?? {}) });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
