// Edge function that returns rich Open Graph / Twitter Card meta tags so
// invitation links pasted into Facebook, Telegram, WhatsApp, X, etc. show
// a preview with the event's internal title, the guest name and the Khmer
// invitation wording — and the first gallery photo.
//
// Two responsibilities:
//   1. Default mode (no `og` query param): respond with OG HTML to crawlers,
//      302 to the human invite page for normal visitors.
//   2. `og=1` mode: stream the cover/gallery image as JPEG with a stable
//      `.jpg`-looking URL. Facebook Messenger inspects the URL extension
//      and refuses `.webp` previews even when the bytes are JPEG.
//
// URL: https://<project>.functions.supabase.co/invite-share?slug=<slug>&token=<token>
//      https://<project>.functions.supabase.co/invite-share?og=1&slug=<slug>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function escapeHtml(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isPreviewCrawler(userAgent: string): boolean {
  return /(bot|crawler|spider|facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher|twitterbot|telegrambot|whatsapp|slackbot|discordbot|linkedinbot|pinterest|skypeuripreview|preview|embedly|applebot|googlebot|bingbot|facebook|messenger)/i.test(
    userAgent
  );
}

function buildHtml(opts: {
  siteName: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  redirectUrl: string;
  shareUrl: string;
}): string {
  const { siteName, title, description, image, imageAlt, redirectUrl, shareUrl } = opts;
  const eTitle = escapeHtml(title);
  const eDesc = escapeHtml(description);
  const eImage = escapeHtml(image);
  const eImageAlt = escapeHtml(imageAlt);
  const eSite = escapeHtml(siteName);
  const eRedirect = escapeHtml(redirectUrl);
  const eShareUrl = escapeHtml(shareUrl);

  // NOTE: No <meta http-equiv="refresh"> and no inline window.location.replace.
  // Crawlers (especially Facebook/Messenger) follow those as redirects and
  // re-scrape the destination, where there are no per-event OG tags.
  // Humans are 302-redirected at the request layer (UA check) and never see
  // this HTML.
  return `<!doctype html>
<html lang="km" prefix="og: https://ogp.me/ns#">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${eTitle}</title>
    <meta name="description" content="${eDesc}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${eSite}" />
    <meta property="og:title" content="${eTitle}" />
    <meta property="og:description" content="${eDesc}" />
    <meta property="og:locale" content="km_KH" />
    <meta property="og:locale:alternate" content="en_US" />
    ${eImage ? `<meta property="og:image" content="${eImage}" />` : ""}
    ${eImage ? `<meta property="og:image:secure_url" content="${eImage}" />` : ""}
    ${eImage ? `<meta property="og:image:type" content="image/jpeg" />` : ""}
    ${eImage ? `<meta property="og:image:width" content="1200" />` : ""}
    ${eImage ? `<meta property="og:image:height" content="630" />` : ""}
    ${eImage ? `<meta property="og:image:alt" content="${eImageAlt}" />` : ""}
    <meta property="og:url" content="${eShareUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${eTitle}" />
    <meta name="twitter:description" content="${eDesc}" />
    ${eImage ? `<meta name="twitter:image" content="${eImage}" />` : ""}
    ${eImage ? `<meta name="twitter:image:alt" content="${eImageAlt}" />` : ""}

    <link rel="canonical" href="${eShareUrl}" />
  </head>
  <body>
    <p><a href="${eRedirect}">${eTitle}</a></p>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathOgMatch = url.pathname.match(/\/og\/([^\/]+?)\.jpg\/?$/);
    const pathOgSlug = pathOgMatch?.[1] ? decodeURIComponent(pathOgMatch[1]) : "";
    const slug = (url.searchParams.get("slug") || pathOgSlug)?.trim();
    const isOgImage = url.searchParams.get("og") === "1" || Boolean(pathOgSlug);

    if (!slug) {
      return new Response("Missing slug", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // -------- OG IMAGE PROXY MODE --------
    // Stream the chosen image as JPEG so the OG image URL can end in `.jpg`.
    // Facebook Messenger validates the URL extension and rejects `.webp`
    // even when the bytes returned are JPEG.
    if (isOgImage) {
      const { data: ev } = await supabase
        .from("events")
        .select("gallery_urls, cover_image_url, cover_background_url, share_preview_index")
        .eq("slug", slug)
        .maybeSingle();

      const gallery = (ev?.gallery_urls as string[] | null) ?? [];
      const pickIdx =
        typeof ev?.share_preview_index === "number" &&
        ev.share_preview_index >= 0 &&
        ev.share_preview_index < gallery.length
          ? ev.share_preview_index
          : 0;
      const rawImage =
        gallery[pickIdx] ??
        gallery[0] ??
        (ev?.cover_image_url as string | null) ??
        (ev?.cover_background_url as string | null) ??
        "";

      if (!rawImage) {
        return new Response("No image", {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }

      // Always go through the image-render endpoint for a 1200x630 JPEG.
      let upstreamUrl = rawImage;
      if (rawImage.includes("/storage/v1/object/public/")) {
        const base = rawImage.replace(
          "/storage/v1/object/public/",
          "/storage/v1/render/image/public/"
        );
        upstreamUrl = `${base}?width=1200&height=630&quality=85&resize=cover`;
      }

      const upstream = await fetch(upstreamUrl);
      if (!upstream.ok) {
        return new Response("Upstream image error", {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }

      const imageBytes = await upstream.arrayBuffer();

      return new Response(imageBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/jpeg",
          "Content-Length": String(imageBytes.byteLength),
          "Content-Disposition": 'inline; filename="preview.jpg"',
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // -------- OG HTML MODE --------
    const token = url.searchParams.get("token")?.trim() || "";

    // Allowlist of trusted base origins for redirects + canonical share URLs.
    // Prevents an open-redirect / phishing vector where an attacker crafts
    // `?site=https://evil.com` to bounce users off a legitimate-looking link.
    const ALLOWED_SITES = new Set([
      "https://www.21invite.online",
      "https://21invite.online",
      "https://share.21invite.online",
      "https://online21invite.lovable.app",
    ]);
    const DEFAULT_SITE = "https://www.21invite.online";
    const rawSite = url.searchParams.get("site")?.trim() || "";
    const baseSite = ALLOWED_SITES.has(rawSite.replace(/\/$/, ""))
      ? rawSite.replace(/\/$/, "")
      : DEFAULT_SITE;

    const redirectUrl = token
      ? `${baseSite}/${encodeURIComponent(slug)}/invite?token=${encodeURIComponent(token)}`
      : `${baseSite}/${encodeURIComponent(slug)}/invite`;

    const fallbackShareUrl = token
      ? `https://share.21invite.online/${encodeURIComponent(slug)}/invite?token=${encodeURIComponent(token)}`
      : `https://share.21invite.online/${encodeURIComponent(slug)}/invite`;
    const rawShareUrl = url.searchParams.get("share_url")?.trim() || "";
    let canonicalShareUrl = fallbackShareUrl;
    try {
      const candidate = new URL(rawShareUrl);
      if (ALLOWED_SITES.has(candidate.origin)) {
        canonicalShareUrl = candidate.toString();
      }
    } catch (_) {
      // Ignore — fallback already set.
    }

    const userAgent = req.headers.get("user-agent") || "";
    if (userAgent && !isPreviewCrawler(userAgent)) {
      return Response.redirect(redirectUrl, 302);
    }

    const { data: ev } = await supabase
      .from("events")
      .select("id, title, internal_title")
      .eq("slug", slug)
      .maybeSingle();

    const internalTitle =
      (ev?.internal_title as string | null) ?? (ev?.title as string | null) ?? "";

    const title = internalTitle
      ? `21Invite.Online — ${internalTitle}`
      : "21Invite.Online";

    const greet = "សូមគោរពអញ្ជើញ";
    const body =
      "ចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរិសួស្តីជ័យមង្គល ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ";
    const description = `${greet} ${body}`;

    // Stable same-origin `.jpg` OG image URL. Facebook is more reliable when
    // the preview image is served from the same host as the shared page.
    let shareOrigin = "https://share.21invite.online";
    try {
      shareOrigin = new URL(canonicalShareUrl).origin;
    } catch (_) {
      // Keep the production share domain fallback.
    }
    const image = `${shareOrigin}/og/${encodeURIComponent(slug)}.jpg`;
    const imageAlt = internalTitle || "21Invite.Online";

    const html = buildHtml({
      siteName: "21Invite.Online",
      title,
      description,
      image,
      imageAlt,
      redirectUrl,
      shareUrl: canonicalShareUrl,
    });

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (err) {
    console.error("invite-share error", err);
    return new Response("Internal error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
