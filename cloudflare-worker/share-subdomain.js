/**
 * Cloudflare Worker for share.21invite.online
 *
 * Route pattern (set in Cloudflare dashboard):
 *   share.21invite.online/*
 *
 * Behavior:
 *   /<slug>/invite?token=<token>
 *     - Crawlers (Telegram, Facebook, WhatsApp, etc.) get OG preview HTML
 *       fetched from the Supabase invite-share edge function.
 *     - Real users get a 302 redirect to:
 *       https://21invite.online/<slug>/invite?token=<token>
 *
 *   /og/<slug>.jpg
 *     - Streams the event's preview image as JPEG. Used as og:image so
 *       Facebook Messenger sees a `.jpg` URL (it rejects `.webp` URLs even
 *       when the bytes are JPEG).
 *
 *   anything else → bounce to root site
 */

const SUPABASE_FN_URL =
  "https://lyhnvcpkxbbafewkzgjo.supabase.co/functions/v1/invite-share";
const ROOT_SITE = "https://21invite.online";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aG52Y3BreGJiYWZld2t6Z2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDUxODUsImV4cCI6MjA5MjU4MTE4NX0.v1ZHwcIvuIHe1ygiJDhVyifKmkn88l7e-tKx58iMxnY";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // -------- /robots.txt → explicitly allow all crawlers --------
    // Overrides Cloudflare's managed robots.txt which blocks meta-externalagent
    // (Facebook/Messenger crawler) and causes 403 in the FB Sharing Debugger.
    if (url.pathname === "/robots.txt") {
      return new Response(
        "User-agent: *\nAllow: /\n",
        {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }
      );
    }

    // -------- /og/<slug>.jpg → OG image proxy --------
    const ogMatch = url.pathname.match(/^\/og\/([^\/]+?)\.jpg\/?$/);
    if (ogMatch) {
      const slug = decodeURIComponent(ogMatch[1]);
      const fnUrl = new URL(SUPABASE_FN_URL);
      fnUrl.searchParams.set("og", "1");
      fnUrl.searchParams.set("slug", slug);

      const upstream = await fetch(fnUrl.toString(), {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const imageBytes = await upstream.arrayBuffer();

      return new Response(imageBytes, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") || "image/jpeg",
          "content-length": String(imageBytes.byteLength),
          "cache-control":
            upstream.headers.get("cache-control") ||
            "public, max-age=86400, s-maxage=86400",
          "content-disposition": 'inline; filename="preview.jpg"',
          "x-content-type-options": "nosniff",
        },
      });
    }

    // -------- /<slug>/invite → OG HTML or human redirect --------
    const inviteMatch = url.pathname.match(/^\/([^\/]+)\/invite\/?$/);
    if (!inviteMatch) {
      return Response.redirect(ROOT_SITE + url.pathname + url.search, 302);
    }

    const slug = inviteMatch[1];
    const token = url.searchParams.get("token") || "";

    const fnUrl = new URL(SUPABASE_FN_URL);
    fnUrl.searchParams.set("slug", slug);
    fnUrl.searchParams.set("token", token);
    fnUrl.searchParams.set("site", ROOT_SITE);

    // Keep the token in the canonical preview URL so Messenger preserves it
    // when the user taps the preview thumbnail. Messenger uses og:url (the
    // canonical) as the click target, not the originally shared link, so a
    // token-less canonical sends users to a generic page.
    fnUrl.searchParams.set("share_url", url.toString());

    const upstream = await fetch(fnUrl.toString(), {
      headers: {
        "user-agent": request.headers.get("user-agent") || "",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      redirect: "manual",
    });

    if (upstream.status === 200) {
      const html = await upstream.text();
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=60, s-maxage=60",
        },
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  },
};
