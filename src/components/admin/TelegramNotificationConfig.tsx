import { useState, useEffect } from "react";
import { Send, CheckCircle2, RefreshCw, ExternalLink, Bot, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_BOT_USERNAME,
  sendTelegramTestNotification,
  sendTelegramRsvpSummary,
  fetchRecentTelegramChats,
  processTelegramBotCommands,
  DetectedTelegramChat,
} from "@/utils/telegramNotification";

type Props = {
  enabled: boolean;
  chatId: string;
  botToken?: string;
  eventTitle: string;
  eventDate?: string | null;
  guests?: any[];
  onChange: (patch: {
    telegram_notifications_enabled?: boolean;
    telegram_chat_id?: string;
    telegram_bot_token?: string;
  }) => void;
};

export default function TelegramNotificationConfig({
  enabled,
  chatId,
  botToken,
  eventTitle,
  eventDate,
  guests = [],
  onChange,
}: Props) {
  const [testing, setTesting] = useState(false);
  const [sharingSummary, setSharingSummary] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedChats, setDetectedChats] = useState<DetectedTelegramChat[]>([]);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const activeBotToken = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;

  // Background listener: check for /summary commands in the Telegram group every 10s
  useEffect(() => {
    if (!chatId?.trim()) return;

    const checkCommands = () => {
      processTelegramBotCommands({
        botToken: activeBotToken,
        getEventDataForChat: async (targetChatId) => {
          if (targetChatId === chatId.trim()) {
            return {
              eventTitle,
              eventDate,
              guests: guests || [],
            };
          }
          return null;
        },
      })
        .then((res) => {
          if (res.processedCount > 0) {
            toast.success(`🤖 Bot responded to ${res.processedCount} command(s) in Telegram!`);
          }
        })
        .catch(() => {});
    };

    checkCommands();
    const interval = setInterval(checkCommands, 10000);
    return () => clearInterval(interval);
  }, [chatId, activeBotToken, eventTitle, eventDate, guests]);

  const handleTest = async () => {
    if (!chatId?.trim()) {
      toast.error("Please enter a Telegram Chat ID or click 'Auto-Detect Group' first.");
      return;
    }
    setTesting(true);
    try {
      const res = await sendTelegramTestNotification(chatId, eventTitle, activeBotToken);
      if (res.success) {
        toast.success("Test message sent successfully to your Telegram group! 🎉");
      } else {
        toast.error(`Telegram error: ${res.error || "Failed to send message. Make sure the bot is added to your group."}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test message");
    } finally {
      setTesting(false);
    }
  };

  const handleShareSummary = async () => {
    if (!chatId?.trim()) {
      toast.error("Please enter a Telegram Chat ID or click 'Auto-Detect Group' first.");
      return;
    }
    setSharingSummary(true);
    try {
      const res = await sendTelegramRsvpSummary({
        chatId,
        botToken: activeBotToken,
        eventTitle,
        eventDate,
        guests: guests || [],
      });
      if (res.success) {
        toast.success("RSVP Summary & guest wishes sent to Telegram group! 📊");
      } else {
        toast.error(`Telegram error: ${res.error || "Failed to send summary"}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send summary");
    } finally {
      setSharingSummary(false);
    }
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const res = await fetchRecentTelegramChats(activeBotToken);
      if (res.error) {
        toast.error(`Could not fetch updates: ${res.error}`);
        return;
      }

      if (!res.chats || res.chats.length === 0) {
        toast.info(
          "No recent messages detected. Please add @EInvitation_Bot to your group and send any message (e.g. 'Hello'), then try again."
        );
        return;
      }

      setDetectedChats(res.chats);

      if (res.chats.length === 1) {
        const c = res.chats[0];
        onChange({ telegram_chat_id: c.id, telegram_notifications_enabled: true });
        toast.success(`Connected to group "${c.title}" (${c.id})!`);
      } else {
        toast.success(`Found ${res.chats.length} recent groups! Select your group below.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to auto-detect group");
    } finally {
      setDetecting(false);
    }
  };

  const attendingCount = guests.filter((g) => g.rsvp_status === "yes").length;
  const totalPax = guests
    .filter((g) => g.rsvp_status === "yes")
    .reduce((sum, g) => sum + (Number(g.party_size) || 1), 0);

  return (
    <div className="space-y-5 rounded-2xl border border-border p-5 bg-card/60 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center shrink-0">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">Telegram RSVP Notifications & /summary</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  enabled && chatId
                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {enabled && chatId ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant alerts on RSVP response, plus group <code>/summary</code> command for guest list, pax & wishes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Label htmlFor="telegram-toggle" className="text-xs text-muted-foreground cursor-pointer">
            {enabled ? "Notifications Enabled" : "Notifications Off"}
          </Label>
          <Switch
            id="telegram-toggle"
            checked={enabled}
            onCheckedChange={(val) => onChange({ telegram_notifications_enabled: val })}
          />
        </div>
      </div>

      {/* Guide Box */}
      <div className="rounded-xl p-3.5 bg-secondary/30 border border-border text-xs space-y-2 text-muted-foreground">
        <div className="font-medium text-foreground flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-[#229ED9]" />
          <span>Quick 3-Step Setup with @{DEFAULT_TELEGRAM_BOT_USERNAME}:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
          <li>
            Open Telegram and add{" "}
            <a
              href={`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#229ED9] hover:underline font-semibold inline-flex items-center gap-1"
            >
              @{DEFAULT_TELEGRAM_BOT_USERNAME} <ExternalLink className="h-3 w-3" />
            </a>{" "}
            to your wedding team or couple's Telegram group.
          </li>
          <li>Send any message in that group (e.g. <i>"Hello bot"</i>).</li>
          <li>
            Click <strong>"Auto-Detect Group"</strong> below to automatically grab the Group Chat ID, or type it manually.
          </li>
        </ol>
        <div className="pt-1 text-[11px] text-foreground font-medium flex items-center gap-1 border-t border-border/50">
          <span>💡 Telegram Group Commands:</span>
          <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">/summary</span>
          <span>shares attending guests, pax & wishes.</span>
          <span className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">/rsvp</span>
          <span>shares counts overview.</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs font-medium flex items-center justify-between">
            <span>Telegram Group Chat ID <span className="text-destructive">*</span></span>
            <span className="text-[11px] text-muted-foreground font-normal">e.g. -5568784428</span>
          </Label>
          <Input
            type="text"
            value={chatId || ""}
            onChange={(e) => onChange({ telegram_chat_id: e.target.value.trim() })}
            placeholder="e.g. -1002345678901 or -5568784428"
            className="h-10 text-sm font-mono"
          />
        </div>

        <div className="md:col-span-6 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="flex-1 h-10 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${detecting ? "animate-spin" : ""}`} />
            {detecting ? "Detecting…" : "Auto-Detect"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || !chatId}
            className="flex-1 h-10 text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {testing ? "Testing…" : "Test Alert"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleShareSummary}
            disabled={sharingSummary || !chatId}
            className="flex-1 h-10 text-xs bg-[#229ED9] hover:bg-[#1e8bc0] text-white"
            title="Share current guest list, pax & wishes to the group"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            {sharingSummary ? "Sharing…" : "Share /summary"}
          </Button>
        </div>
      </div>

      {/* Detected Chats Selector (if multiple groups found) */}
      {detectedChats.length > 1 && (
        <div className="rounded-xl p-3 border border-border bg-background space-y-2">
          <p className="text-xs font-medium text-foreground">Select your Telegram Group from recent messages:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detectedChats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange({ telegram_chat_id: c.id, telegram_notifications_enabled: true });
                  toast.success(`Selected "${c.title}"`);
                }}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                  chatId === c.id
                    ? "border-[#229ED9] bg-[#229ED9]/10 text-foreground"
                    : "border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-foreground truncate">{c.title}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{c.id} ({c.type})</div>
                </div>
                {chatId === c.id && <CheckCircle2 className="h-4 w-4 text-[#229ED9] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Status indicator */}
      {chatId && (
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Connected to Chat ID: <strong className="font-mono text-foreground">{chatId}</strong>
          </span>
          <span>
            Current: <strong className="text-foreground">{attendingCount}</strong> attending ({totalPax} pax)
          </span>
        </div>
      )}

      {/* Advanced Custom Bot Token Toggle */}
      <div className="pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowTokenInput(!showTokenInput)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1"
        >
          {showTokenInput ? "Hide custom Bot Token (using @EInvitation_Bot)" : "Advanced: Use custom Telegram Bot Token"}
        </button>

        {showTokenInput && (
          <div className="mt-3 space-y-1.5">
            <Label className="text-xs">Custom Telegram Bot Token (optional)</Label>
            <Input
              type="password"
              value={botToken || ""}
              onChange={(e) => onChange({ telegram_bot_token: e.target.value.trim() })}
              placeholder={DEFAULT_TELEGRAM_BOT_TOKEN}
              className="h-9 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank to use the pre-configured <strong>@{DEFAULT_TELEGRAM_BOT_USERNAME}</strong> bot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
