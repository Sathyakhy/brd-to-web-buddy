import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  ExternalLink,
  Send,
  MessageSquare,
  Check,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { thumbUrl } from "@/lib/imageUrl";

export type SocialShareConfig = {
  og_image_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  share_preview_index?: number | null;
};

export type SocialShareMetadataEditorProps = {
  eventId?: string;
  config: SocialShareConfig;
  onChange: (patch: Partial<SocialShareConfig>) => void;
  defaultTitle?: string;
  defaultDescription?: string;
  galleryUrls?: string[];
  coverImageUrl?: string | null;
  coverBackgroundUrl?: string | null;
  slug?: string;
  className?: string;
};

export default function SocialShareMetadataEditor({
  eventId,
  config,
  onChange,
  defaultTitle = "Wedding Celebration",
  defaultDescription = "សូមគោរពអញ្ជើញ ចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរិសួស្តីជ័យមង្គល ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ",
  galleryUrls = [],
  coverImageUrl = null,
  coverBackgroundUrl = null,
  slug = "wedding-demo",
  className = "",
}: SocialShareMetadataEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"telegram" | "messenger">("telegram");

  // Effective metadata values
  const effectiveTitle = config.og_title?.trim() || `21Invite.Online — ${defaultTitle}`;
  const effectiveDescription = config.og_description?.trim() || defaultDescription;

  // Selected image resolution
  const pickGalleryIdx =
    typeof config.share_preview_index === "number" &&
    config.share_preview_index >= 0 &&
    config.share_preview_index < galleryUrls.length
      ? config.share_preview_index
      : 0;

  const effectiveImage =
    config.og_image_url ||
    galleryUrls[pickGalleryIdx] ||
    galleryUrls[0] ||
    coverImageUrl ||
    coverBackgroundUrl ||
    "/placeholder.svg";

  const handleUploadImage = async (file: File) => {
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const folder = eventId || "shared-metadata";
      const path = `${folder}/og-share-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("event-media")
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("event-media").getPublicUrl(path);
      onChange({ og_image_url: data.publicUrl });
      toast.success("Social share image uploaded! Click Save to apply.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Info */}
      <div className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-gold/15 text-gold">
            <Share2 className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-semibold tracking-wide">
            Social Share Metadata (Telegram, Messenger, WhatsApp, Facebook)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When you copy and paste this wedding invitation link into Telegram, Messenger, or WhatsApp, the platform automatically scrapes this thumbnail image, title, and description for the rich link preview card.
        </p>
      </div>

      {/* 1. Upload Custom Share Image */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gold" />
            <span>Link Preview Image (Metadata Thumbnail)</span>
          </Label>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Recommended: 1200 × 630 px (1.91:1)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Current Selected Preview Image */}
          <div className="md:col-span-5 relative aspect-[1200/630] rounded-lg border border-border overflow-hidden bg-black/5 flex items-center justify-center group">
            <img
              src={effectiveImage}
              alt="Social share preview"
              className="h-full w-full object-cover"
            />
            {config.og_image_url && (
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 rounded-full shadow-md"
                  onClick={() => onChange({ og_image_url: null })}
                  title="Remove custom image and use default"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[10px] text-white flex items-center justify-between">
              <span>{config.og_image_url ? "Custom Uploaded Image" : "Auto-selected from gallery/cover"}</span>
              <span className="font-mono opacity-80">1200 × 630</span>
            </div>
          </div>

          {/* Upload and Quick Select Controls */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 transition-all text-xs font-semibold shadow-xs">
                <Upload className="h-4 w-4" />
                <span>{uploading ? "Uploading Image…" : "Upload Dedicated Share Image"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file);
                    e.target.value = "";
                  }}
                />
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Upload a custom horizontal photo or banner designed specifically for chat cards.
              </p>
            </div>

            {/* Quick Pick from Gallery Photos if available */}
            {galleryUrls.length > 0 && (
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <span className="text-[11px] font-medium text-foreground/80 block">
                  Or choose from your gallery photos:
                </span>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-28 overflow-y-auto p-1 bg-secondary/30 rounded-md border border-border/50">
                  {galleryUrls.map((url, idx) => {
                    const isSelected = !config.og_image_url && (config.share_preview_index ?? 0) === idx;
                    return (
                      <button
                        type="button"
                        key={`sp-gal-${idx}-${url}`}
                        onClick={() => {
                          onChange({ og_image_url: null, share_preview_index: idx });
                        }}
                        className={`relative aspect-square overflow-hidden rounded border-2 transition ${
                          isSelected ? "border-gold ring-2 ring-gold/40" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={`Select gallery photo #${idx + 1}`}
                      >
                        <img
                          src={thumbUrl(url, 100)}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white drop-shadow-md" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Custom Title & Description */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Link Card Text Settings
        </h5>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Custom Share Title (Optional)</Label>
            <Input
              value={config.og_title ?? ""}
              onChange={(e) => onChange({ og_title: e.target.value || null })}
              placeholder={`21Invite.Online — ${defaultTitle}`}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Defaults to <code className="text-xs text-gold">21Invite.Online — {defaultTitle}</code> if left blank.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Custom Share Description (Optional)</Label>
            <Textarea
              rows={2}
              value={config.og_description ?? ""}
              onChange={(e) => onChange({ og_description: e.target.value || null })}
              placeholder={defaultDescription}
              className="text-xs resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Preview subtitle shown beneath the link title in Telegram and Messenger chats.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Live Mockup Previews for Telegram & Messenger */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Live Chat Card Mockup</span>
          </span>

          <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setPreviewTab("telegram")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                previewTab === "telegram"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Send className="h-3 w-3 text-sky-500" />
              <span>Telegram</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("messenger")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                previewTab === "messenger"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3 w-3 text-blue-600" />
              <span>Messenger</span>
            </button>
          </div>
        </div>

        {/* Telegram Card Mockup */}
        {previewTab === "telegram" && (
          <div className="p-4 rounded-xl bg-[#0f1922] text-white border border-[#233544] max-w-md mx-auto space-y-2">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <Send className="h-3.5 w-3.5" />
              <span>Telegram Chat Preview</span>
            </div>
            <div className="rounded-lg bg-[#182533] border-l-2 border-sky-400 p-2.5 space-y-2 overflow-hidden shadow-lg">
              <span className="text-[11px] font-semibold text-sky-400 block">21Invite.Online</span>
              <div className="font-bold text-xs text-white leading-snug line-clamp-1">
                {effectiveTitle}
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">
                {effectiveDescription}
              </p>
              <div className="aspect-[1200/630] w-full rounded overflow-hidden bg-black/40">
                <img
                  src={effectiveImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-400 text-right block">12:00 PM</span>
          </div>
        )}

        {/* Messenger Card Mockup */}
        {previewTab === "messenger" && (
          <div className="p-4 rounded-xl bg-[#f0f2f5] dark:bg-[#18191a] border border-border max-w-md mx-auto space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Facebook Messenger Card</span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#242526] border border-border/80 shadow-md">
              <div className="aspect-[1200/630] w-full bg-black/5 overflow-hidden">
                <img
                  src={effectiveImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  SHARE.21INVITE.ONLINE
                </span>
                <div className="font-bold text-xs text-foreground leading-snug line-clamp-1">
                  {effectiveTitle}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {effectiveDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/50">
          <Info className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
          <span>
            Social platforms (Telegram &amp; Facebook) cache link previews. After clicking <strong>Save changes</strong>, test with a fresh invitation link or use the Facebook Sharing Debugger / Telegram Webpage Bot to see immediate updates.
          </span>
        </div>
      </div>
    </div>
  );
}
