import React, { useState } from "react";
import { Globe, Sparkles, Languages, Check, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DualLanguageConfig,
  LanguageContent,
  buildEnglishPresets,
} from "@/lib/dualLanguage";
import { TemplateData } from "@/components/templates/InvitationTemplate";

type Props = {
  config: DualLanguageConfig;
  onChange: (updated: DualLanguageConfig) => void;
  baseEvent: Partial<TemplateData>;
};

export default function DualLanguageEditor({
  config,
  onChange,
  baseEvent,
}: Props) {
  const [activeLangTab, setActiveLangTab] = useState<"km" | "en">("km");

  const isEnabled = config.enabled;

  const handleToggle = (checked: boolean) => {
    // If enabling for the first time and english content is empty, seed with presets
    let enContent = { ...config.en };
    if (checked && (!enContent.title || !enContent.title.trim())) {
      enContent = {
        ...buildEnglishPresets(baseEvent),
        ...enContent,
      };
    }

    onChange({
      ...config,
      enabled: checked,
      en: enContent,
    });
  };

  const handleUpdateKm = (field: keyof LanguageContent, val: string | null) => {
    onChange({
      ...config,
      km: {
        ...config.km,
        [field]: val,
      },
    });
  };

  const handleUpdateEn = (field: keyof LanguageContent, val: string | null) => {
    onChange({
      ...config,
      en: {
        ...config.en,
        [field]: val,
      },
    });
  };

  const handleAutoFillEnglish = () => {
    const presets = buildEnglishPresets(baseEvent);
    onChange({
      ...config,
      en: {
        ...presets,
        ...config.en,
        title: config.en.title?.trim() ? config.en.title : presets.title,
        cover_message: config.en.cover_message?.trim() ? config.en.cover_message : presets.cover_message,
        countdown_message: config.en.countdown_message?.trim() ? config.en.countdown_message : presets.countdown_message,
        description: config.en.description?.trim() ? config.en.description : presets.description,
        venue: config.en.venue?.trim() ? config.en.venue : presets.venue,
        ceremony_time: config.en.ceremony_time?.trim() ? config.en.ceremony_time : presets.ceremony_time,
        reception_time: config.en.reception_time?.trim() ? config.en.reception_time : presets.reception_time,
        dress_code: config.en.dress_code?.trim() ? config.en.dress_code : presets.dress_code,
        qr_code_message: config.en.qr_code_message?.trim() ? config.en.qr_code_message : presets.qr_code_message,
        apologies_message: config.en.apologies_message?.trim() ? config.en.apologies_message : presets.apologies_message,
        thank_you_message: config.en.thank_you_message?.trim() ? config.en.thank_you_message : presets.thank_you_message,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Master Enable Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-card/60 shadow-sm">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold" />
            <span className="font-semibold text-base text-foreground">
              Dual Language Support (ភាសាខ្មែរ / English)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Allow guests to toggle between Khmer and English versions. Both versions maintain the exact same design, layout, background, and music.
          </p>
        </div>
        <Switch
          id="dual-language-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          aria-label="Toggle dual language"
        />
      </div>

      {isEnabled && (
        <div className="space-y-6 pt-2">
          {/* Default Language Setting */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-secondary/30 text-sm">
            <div className="space-y-0.5">
              <span className="font-medium text-foreground">Initial Language for Guests</span>
              <p className="text-xs text-muted-foreground">
                Which language opens first when guests visit the invitation link.
              </p>
            </div>
            <div className="inline-flex items-center p-1 bg-background rounded-lg border border-border shadow-xs">
              <button
                type="button"
                onClick={() => onChange({ ...config, default_language: "km" })}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  (config.default_language ?? "km") === "km"
                    ? "bg-gold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Khmer (Default)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, default_language: "en" })}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  config.default_language === "en"
                    ? "bg-gold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Bilingual Content Editor Tabs */}
          <Tabs
            value={activeLangTab}
            onValueChange={(v) => setActiveLangTab(v as "km" | "en")}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto h-10 p-1 bg-secondary/80">
                <TabsTrigger
                  value="km"
                  className="data-[state=active]:bg-background data-[state=active]:text-gold font-medium text-xs sm:text-sm px-4"
                >
                  🇰🇭 Khmer Content
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="data-[state=active]:bg-background data-[state=active]:text-gold font-medium text-xs sm:text-sm px-4"
                >
                  🇬🇧 English Content
                </TabsTrigger>
              </TabsList>

              {activeLangTab === "en" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillEnglish}
                  className="text-xs text-gold border-gold/40 hover:bg-gold/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Auto-fill English Presets
                </Button>
              )}
            </div>

            {/* ──────── KHMER CONTENT TAB ──────── */}
            <TabsContent value="km" className="space-y-5 pt-4">
              <div className="p-3 rounded-lg border border-gold/20 bg-gold/5 text-xs text-foreground/80 flex items-center gap-2">
                <span className="font-semibold text-gold">Khmer version:</span>
                Values here override the base event fields for Khmer visitors. Leave empty to use the standard event fields.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title (ចំណងជើងធៀប)</Label>
                  <Input
                    value={config.km.title ?? baseEvent.title ?? ""}
                    onChange={(e) => handleUpdateKm("title", e.target.value)}
                    placeholder="សិរីសួស្តីអាពាហ៍ពិពាហ៍"
                    className="font-khmer-moul"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Honorific Invitation Lines (ពាក្យគោរពអញ្ជើញ - max 4)</Label>
                  <Textarea
                    rows={4}
                    value={config.km.cover_message ?? baseEvent.cover_message ?? ""}
                    onChange={(e) => handleUpdateKm("cover_message", e.target.value)}
                    placeholder="សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ..."
                    className="text-center font-khmer-siemreap"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Groom's Name (ឈ្មោះកូនកំលោះ)</Label>
                  <Input
                    value={config.km.groom_name ?? baseEvent.groom_name ?? ""}
                    onChange={(e) => handleUpdateKm("groom_name", e.target.value)}
                    placeholder="កូនកំលោះ"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bride's Name (ឈ្មោះកូនក្រមុំ)</Label>
                  <Input
                    value={config.km.bride_name ?? baseEvent.bride_name ?? ""}
                    onChange={(e) => handleUpdateKm("bride_name", e.target.value)}
                    placeholder="កូនក្រមុំ"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ceremony Time (ពេលវេលាពិធីសំពះផ្ទឹម)</Label>
                  <Input
                    value={config.km.ceremony_time ?? baseEvent.ceremony_time ?? ""}
                    onChange={(e) => handleUpdateKm("ceremony_time", e.target.value)}
                    placeholder="៦:០០ ព្រឹក"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reception Time (ពេលវេលាពិធីពិសាភោជនាហារ)</Label>
                  <Input
                    value={config.km.reception_time ?? baseEvent.reception_time ?? ""}
                    onChange={(e) => handleUpdateKm("reception_time", e.target.value)}
                    placeholder="៥:០០ ល្ងាច"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Venue Name (ទីតាំងប្រារព្ធពិធី)</Label>
                  <Input
                    value={config.km.venue ?? (baseEvent.venue ? baseEvent.venue.split("|")[0] : "")}
                    onChange={(e) => handleUpdateKm("venue", e.target.value)}
                    placeholder="សណ្ឋាគារ..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Countdown Headline (សាររាប់ថយក្រោយ)</Label>
                  <Input
                    value={config.km.countdown_message ?? baseEvent.countdown_message ?? ""}
                    onChange={(e) => handleUpdateKm("countdown_message", e.target.value)}
                    placeholder="អ្នកត្រូវបានអញ្ជើញមកចូលរួមក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ!"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>QR Code Gift Description (សារផ្ញើចំណងដៃ)</Label>
                  <Textarea
                    rows={2}
                    value={config.km.qr_code_message ?? baseEvent.qr_code_message ?? ""}
                    onChange={(e) => handleUpdateKm("qr_code_message", e.target.value)}
                    placeholder="លោកអ្នកក៏អាចផ្ញើចំណងដៃតាមរយៈគណនី QR code របស់ពួកយើង..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Apologies Letter Message (លិខិតសូមអភ័យទោស)</Label>
                  <Textarea
                    rows={4}
                    value={config.km.apologies_message ?? baseEvent.apologies_message ?? ""}
                    onChange={(e) => handleUpdateKm("apologies_message", e.target.value)}
                    placeholder="យើងខ្ញុំជាមាតាបិតា កូនប្រុស កូនស្រី សូមអភ័យទោស..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Thank You Letter Message (លិខិតថ្លែងអំណរគុណ)</Label>
                  <Textarea
                    rows={4}
                    value={config.km.thank_you_message ?? baseEvent.thank_you_message ?? ""}
                    onChange={(e) => handleUpdateKm("thank_you_message", e.target.value)}
                    placeholder="យើងខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅ..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* ──────── ENGLISH CONTENT TAB ──────── */}
            <TabsContent value="en" className="space-y-5 pt-4">
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-foreground/80 flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-blue-500">English version:</span>
                  {" "}Guests who switch to EN will see this content. All background, layout, and music remain identical.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title (English)</Label>
                  <Input
                    value={config.en.title ?? ""}
                    onChange={(e) => handleUpdateEn("title", e.target.value)}
                    placeholder="The Wedding Celebration"
                    className="font-serif tracking-wide"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Honorific Invitation Lines (max 4 lines)</Label>
                  <Textarea
                    rows={4}
                    value={config.en.cover_message ?? ""}
                    onChange={(e) => handleUpdateEn("cover_message", e.target.value)}
                    placeholder="Together with their parents\nCordially invite you to celebrate their wedding"
                    className="text-center font-serif"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Groom's Name (Latin / English)</Label>
                  <Input
                    value={config.en.groom_name ?? ""}
                    onChange={(e) => handleUpdateEn("groom_name", e.target.value)}
                    placeholder="Groom's Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bride's Name (Latin / English)</Label>
                  <Input
                    value={config.en.bride_name ?? ""}
                    onChange={(e) => handleUpdateEn("bride_name", e.target.value)}
                    placeholder="Bride's Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ceremony Time (English)</Label>
                  <Input
                    value={config.en.ceremony_time ?? ""}
                    onChange={(e) => handleUpdateEn("ceremony_time", e.target.value)}
                    placeholder="7:00 AM - Traditional Ceremony"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reception Time (English)</Label>
                  <Input
                    value={config.en.reception_time ?? ""}
                    onChange={(e) => handleUpdateEn("reception_time", e.target.value)}
                    placeholder="5:00 PM - Wedding Banquet & Reception"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Venue Name (English)</Label>
                  <Input
                    value={config.en.venue ?? ""}
                    onChange={(e) => handleUpdateEn("venue", e.target.value)}
                    placeholder="Grand Ballroom, Phnom Penh"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dress Code (English)</Label>
                  <Input
                    value={config.en.dress_code ?? ""}
                    onChange={(e) => handleUpdateEn("dress_code", e.target.value)}
                    placeholder="Formal / Traditional Khmer Attire"
                  />
                </div>

                <div className="space-y-2">
                  <Label>QR Account Holder Name (English)</Label>
                  <Input
                    value={config.en.qr_account_name ?? ""}
                    onChange={(e) => handleUpdateEn("qr_account_name", e.target.value)}
                    placeholder="Wedding Gift"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Countdown Headline (English)</Label>
                  <Input
                    value={config.en.countdown_message ?? ""}
                    onChange={(e) => handleUpdateEn("countdown_message", e.target.value)}
                    placeholder="We cannot wait to celebrate with you!"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>QR Gift Transfer Description (English)</Label>
                  <Textarea
                    rows={2}
                    value={config.en.qr_code_message ?? ""}
                    onChange={(e) => handleUpdateEn("qr_code_message", e.target.value)}
                    placeholder="You may send your warmest wedding blessings via bank transfer below."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Apologies Letter Message (English)</Label>
                  <Textarea
                    rows={4}
                    value={config.en.apologies_message ?? ""}
                    onChange={(e) => handleUpdateEn("apologies_message", e.target.value)}
                    placeholder="We sincerely apologize for any shortcomings or if we were unable to extend our invitation in person. Your blessings and presence mean everything to us."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Thank You Letter Message (English)</Label>
                  <Textarea
                    rows={4}
                    value={config.en.thank_you_message ?? ""}
                    onChange={(e) => handleUpdateEn("thank_you_message", e.target.value)}
                    placeholder="Our deepest and warmest gratitude to our beloved parents, family, and esteemed guests for honouring us on our wedding day."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
