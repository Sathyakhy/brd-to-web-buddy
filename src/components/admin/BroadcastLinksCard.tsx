import { useState } from "react";
import { Copy, Check, ExternalLink, MessageSquare, Send, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatKhmerDateLocal } from "@/lib/invitation";

export type BroadcastLinksCardProps = {
  slug: string;
  groomName?: string | null;
  brideName?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  title?: string | null;
};

export default function BroadcastLinksCard({
  slug,
  groomName,
  brideName,
  eventDate,
  venue,
  title,
}: BroadcastLinksCardProps) {
  const [copiedKm, setCopiedKm] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedMsgKm, setCopiedMsgKm] = useState(false);
  const [copiedMsgEn, setCopiedMsgEn] = useState(false);

  // Link URLs
  const khmerShareUrl = `https://share.21invite.online/${encodeURIComponent(slug)}/invite?lang=km`;
  const englishShareUrl = `https://share.21invite.online/${encodeURIComponent(slug)}/invite?lang=en`;

  const khmerDirectUrl = `https://21invite.online/${slug}/invite?lang=km`;
  const englishDirectUrl = `https://21invite.online/${slug}/invite?lang=en`;

  const cleanName = (raw?: string | null) => {
    if (!raw) return "";
    const lines = raw.split(/\r?\n|\s\/\s/).map(s => s.trim()).filter(Boolean);
    const target = lines.length >= 3 ? lines[2] : (lines.length === 1 ? lines[0] : (lines[lines.length - 1] || ""));
    const parts = target.split("|").map(s => s.trim()).filter(Boolean);
    return parts.join(" ").trim();
  };

  const groom = cleanName(groomName) || "<Groom's Name>";
  const bride = cleanName(brideName) || "<Bride's Name>";
  const coupleKh = `${groom} និង ${bride}`;
  const coupleEn = `${groom} & ${bride}`;

  const dateKh = formatKhmerDateLocal(eventDate) || "<កាលបរិច្ឆេទ>";
  const dateEn = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "<Date>";

  const venueKh = ((venue ?? "").split("|")[0] ?? "").trim() || "<ទីតាំង>";
  const venueEn = ((venue ?? "").split("|")[1] ?? (venue ?? "").split("|")[0] ?? "").trim() || "<Venue>";

  const buildKhmerMsg = () => {
    return [
      "សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយសទាំងអស់",
      "",
      `ដោយសេចក្តីគោរព ពីយើងខ្ញុំ ${coupleKh} សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ អ្នកឧកញ៉ា លោកឧកញ៉ា លោក លោកស្រី និងភ្ញៀវកិត្តិយសទាំងអស់ មេត្តាអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយសក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ ដែលនឹងប្រព្រឹត្តទៅនៅ${dateKh} នៅ${venueKh} ដោយមេត្រីភាព និងកិត្តិយសដ៏ខ្ពង់ខ្ពស់ 🙏`,
      "",
      "ការអញ្ជើញចូលរួមរបស់លោក លោកស្រី និងភ្ញៀវកិត្តិយសទាំងអស់ គឺជាកិត្តិយសដ៏ខ្ពង់ខ្ពស់ និងធ្វើឱ្យថ្ងៃមង្គលរបស់យើងខ្ញុំកាន់តែមានន័យ 🙏",
      "",
      "យើងខ្ញុំទាំងពីរសូមអធ្យាស្រ័យយ៉ាងខ្ពង់ខ្ពស់ ចំពោះភ្ញៀវកិត្តិយសទាំងអស់ ដែលយើងខ្ញុំមិនអាចទៅគោរពអញ្ជើញដោយផ្ទាល់ 🙏",
      "",
      "ដោយសេចក្តីគោរព និងសេចក្តីស្រឡាញ់យ៉ាងខ្ពង់ខ្ពស់ 🙏",
      "",
      "សម្រាប់ព័ត៌មានលម្អិតបន្ថែម និងឆ្លើយតបការចូលរួម (RSVP) សូមមេត្តាចូលមើលពាក្យអញ្ជើញអេឡិចត្រូនិករបស់យើងខ្ញុំតាមតំណភ្ជាប់ខាងក្រោម 👇",
      khmerShareUrl,
    ].join("\n");
  };

  const buildEnglishMsg = () => {
    return [
      "WEDDING INVITATION",
      "",
      `We cordially invite you to celebrate the wedding ceremony of ${coupleEn} as our honored guest on ${dateEn} at ${venueEn}.`,
      "",
      "Your presence and blessings on our special day would bring us immense joy and happiness.",
      "",
      "Please kindly open our online wedding invitation below to view the event details, agenda, map, and to send your RSVP:",
      englishShareUrl,
    ].join("\n");
  };

  const copyToClipboard = async (text: string, type: "kmLink" | "enLink" | "kmMsg" | "enMsg") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "kmLink") {
        setCopiedKm(true);
        setTimeout(() => setCopiedKm(false), 2000);
        toast.success("Khmer broadcast link copied to clipboard!");
      } else if (type === "enLink") {
        setCopiedEn(true);
        setTimeout(() => setCopiedEn(false), 2000);
        toast.success("English broadcast link copied to clipboard!");
      } else if (type === "kmMsg") {
        setCopiedMsgKm(true);
        setTimeout(() => setCopiedMsgKm(false), 2000);
        toast.success("Khmer Telegram/Messenger invitation message copied!");
      } else if (type === "enMsg") {
        setCopiedMsgEn(true);
        setTimeout(() => setCopiedMsgEn(false), 2000);
        toast.success("English WhatsApp/Chat invitation message copied!");
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="rounded-xl border-2 border-gold/40 bg-gradient-to-b from-gold/10 via-background to-background p-4 sm:p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              <span>Dual Broadcast Links (Open RSVP Links)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                2 Links Mode
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share these 2 direct links with Cambodian and foreign guests. Guests can open the invitation, write their name & warm wishes, and submit RSVP directly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Link 1: Cambodian Guests (Khmer Default) */}
        <div className="rounded-lg border border-gold/30 bg-card p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇰🇭</span>
                <div>
                  <h4 className="font-semibold text-sm">For Cambodian Guests</h4>
                  <p className="text-[11px] text-muted-foreground">Default: ភាសាខ្មែរ (Khmer Language)</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                Default Khmer
              </span>
            </div>

            <div className="bg-secondary/40 p-2.5 rounded-md border border-border/80 text-xs font-mono text-foreground break-all select-all">
              {khmerShareUrl}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => copyToClipboard(khmerShareUrl, "kmLink")}
              className="bg-gold hover:bg-gold-light text-primary-foreground text-xs h-8"
            >
              {copiedKm ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedKm ? "Copied Link" : "Copy Khmer Link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(buildKhmerMsg(), "kmMsg")}
              className="text-xs h-8 border-gold/40 hover:bg-gold/10"
            >
              {copiedMsgKm ? <Check className="h-3.5 w-3.5 mr-1" /> : <MessageSquare className="h-3.5 w-3.5 mr-1 text-gold" />}
              {copiedMsgKm ? "Copied Message" : "Copy Telegram Message"}
            </Button>
            <a
              href={khmerDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto"
            >
              <Button type="button" variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
            </a>
          </div>
        </div>

        {/* Link 2: Foreigner Guests (English Default) */}
        <div className="rounded-lg border border-blue-500/30 bg-card p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <div>
                  <h4 className="font-semibold text-sm">For Foreigner Guests</h4>
                  <p className="text-[11px] text-muted-foreground">Default: English Language</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 border border-blue-500/30">
                Default English
              </span>
            </div>

            <div className="bg-secondary/40 p-2.5 rounded-md border border-border/80 text-xs font-mono text-foreground break-all select-all">
              {englishShareUrl}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => copyToClipboard(englishShareUrl, "enLink")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              {copiedEn ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedEn ? "Copied Link" : "Copy English Link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(buildEnglishMsg(), "enMsg")}
              className="text-xs h-8 border-blue-500/40 hover:bg-blue-500/10"
            >
              {copiedMsgEn ? <Check className="h-3.5 w-3.5 mr-1" /> : <MessageSquare className="h-3.5 w-3.5 mr-1 text-blue-500" />}
              {copiedMsgEn ? "Copied Message" : "Copy WhatsApp Message"}
            </Button>
            <a
              href={englishDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto"
            >
              <Button type="button" variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
