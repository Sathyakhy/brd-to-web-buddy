import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, Trash2, Facebook, Instagram, Send } from "lucide-react";

type Settings = {
  logo_url: string | null;
  footer_text: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  telegram_url: string | null;
};

const EMPTY: Settings = {
  logo_url: null,
  footer_text: "Invitation made with love by 21Invite.Online",
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  telegram_url: null,
};

export default function SiteSettings() {
  const [s, setS] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url, footer_text, facebook_url, instagram_url, tiktok_url, telegram_url")
        .eq("id", "global")
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) setS({ ...EMPTY, ...data });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: "global", ...s }, { onConflict: "id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Site settings saved");
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `site/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("event-media")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("event-media").getPublicUrl(path);
    const next = { ...s, logo_url: data.publicUrl };
    setS(next);
    await supabase
      .from("site_settings")
      .upsert({ id: "global", ...next }, { onConflict: "id" });
    setUploading(false);
    toast.success("Logo uploaded");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-muted-foreground text-sm">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-8">
        <header>
          <h1 className="font-serif text-3xl text-gradient-gold">Site Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            These appear in the footer of every published invitation.
          </p>
        </header>

        {/* Logo */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-serif text-xl">Logo</h2>
            <p className="text-xs text-muted-foreground">
              Square or wide PNG/SVG works best. Shown above the footer line.
            </p>
          </div>
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-32 h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {s.logo_url ? (
                <img src={s.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-smooth w-fit">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo(f);
                  }}
                />
              </Label>
              {s.logo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const next = { ...s, logo_url: null };
                    setS(next);
                    await supabase
                      .from("site_settings")
                      .upsert({ id: "global", ...next }, { onConflict: "id" });
                    toast.success("Logo removed");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Footer text */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div>
            <h2 className="font-serif text-xl">Footer text</h2>
            <p className="text-xs text-muted-foreground">
              Shown beneath the logo on every invitation.
            </p>
          </div>
          <Textarea
            rows={2}
            value={s.footer_text ?? ""}
            onChange={(e) =>
              setS({ ...s, footer_text: e.target.value.replace(/[\r\n]+/g, " ") })
            }
            placeholder="Invitation made with love by 21Invite.Online"
          />
        </section>

        {/* Social links */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-serif text-xl">Social links</h2>
            <p className="text-xs text-muted-foreground">
              Leave a field empty to hide that icon. Use full URLs (https://…).
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SocialField
              icon={<Facebook className="h-4 w-4" />}
              label="Facebook"
              value={s.facebook_url ?? ""}
              placeholder="https://facebook.com/yourpage"
              onChange={(v) => setS({ ...s, facebook_url: v || null })}
            />
            <SocialField
              icon={<Instagram className="h-4 w-4" />}
              label="Instagram"
              value={s.instagram_url ?? ""}
              placeholder="https://instagram.com/yourhandle"
              onChange={(v) => setS({ ...s, instagram_url: v || null })}
            />
            <SocialField
              icon={<TikTokIcon />}
              label="TikTok"
              value={s.tiktok_url ?? ""}
              placeholder="https://tiktok.com/@yourhandle"
              onChange={(v) => setS({ ...s, tiktok_url: v || null })}
            />
            <SocialField
              icon={<Send className="h-4 w-4" />}
              label="Telegram"
              value={s.telegram_url ?? ""}
              placeholder="https://t.me/yourhandle"
              onChange={(v) => setS({ ...s, telegram_url: v || null })}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function SocialField({
  icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={placeholder}
      />
    </div>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.36V15a6 6 0 1 1-6-6c.34 0 .67.03 1 .09v3.16A3 3 0 1 0 13.5 15V3z" />
    </svg>
  );
}
