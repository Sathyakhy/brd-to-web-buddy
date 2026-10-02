import { useState, useEffect } from "react";
import { Send, CheckCircle2, RefreshCw, ExternalLink, Bot, FileText, Check, BarChart2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_BOT_USERNAME,
  sendTelegramTestNotification,
  sendTelegramRsvpQuickSummary,
  sendTelegramRsvpDetailList,
  fetchRecentTelegramChats,
  processTelegramBotCommands,
  registerTelegramChatEvent,
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
  const [sharingQuick, setSharingQuick] = useState(false);
  const [sharingDetail, setSharingDetail] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedChats, setDetectedChats] = useState<DetectedTelegramChat[]>([]);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [listeningCount, setListeningCount] = useState(0);

  const activeBotToken = (botToken || "").trim() || DEFAULT_TELEGRAM_BOT_TOKEN;

  // Immediately register this event in memory and cache when chatId is set
  useEffect(() => {
    if (chatId?.trim()) {
      registerTelegramChatEvent(chatId.trim(), {
        eventTitle,
        eventDate,
        guests: guests || [],
      });
    }
  }, [chatId, eventTitle, eventDate, guests]);

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

  const handleShareQuickSummary = async () => {
    if (!chatId?.trim()) {
      toast.error("Please enter a Telegram Chat ID or click 'Auto-Detect Group' first.");
      return;
    }
    setSharingQuick(true);
    try {
      const res = await sendTelegramRsvpQuickSummary({
        chatId,
        botToken: activeBotToken,
        eventTitle,
        eventDate,
        guests: guests || [],
      });
      if (res.success) {
        toast.success("Quick RSVP Summary sent to Telegram group! 📊");
      } else {
        toast.error(`Telegram error: ${res.error || "Failed to send quick summary"}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send quick summary");
    } finally {
      setSharingQuick(false);
    }
  };

  const handleShareDetailList = async () => {
    if (!chatId?.trim()) {
      toast.error("Please enter a Telegram Chat ID or click 'Auto-Detect Group' first.");
      return;
    }
    setSharingDetail(true);
    try {
      const res = await sendTelegramRsvpDetailList({
        chatId,
        botToken: activeBotToken,
        eventTitle,
        eventDate,
        guests: guests || [],
      });
      if (res.success) {
        toast.success("Detailed guest list & wishes sent to Telegram group! 📋");
      } else {
        toast.error(`Telegram error: ${res.error || "Failed to send detail list"}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send detail list");
    } finally {
      setSharingDetail(false);
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
              <h3 className="font-semibold text-base">Telegram RSVP Notifications & Bot Commands</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  enabled && chatId
                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {enabled && chatId ? "Active" : "Disabled"}
              </span>
              {enabled && chatId && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Listening
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live alerts on every response, plus group commands for quick summary (<code>/rsvp</code>) and detailed wishes (<code>/summary</code>).
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
          <li>Send any message in that group (e.g. <i>"Hello"</i>).</li>
          <li>
            Click <strong>"Auto-Detect Group"</strong> below to automatically grab the Group Chat ID, or type it manually.
          </li>
        </ol>
        <div className="pt-2 border-t border-border/50 space-y-1 text-[11px] text-foreground">
          <div className="font-semibold text-[#229ED9]">Commands you can type directly in your Telegram group:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
            <div className="bg-background/80 p-2 rounded-lg border border-border">
              <span className="font-mono font-bold text-foreground">/rsvp</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Quick summary of headcount & counts</p>
            </div>
            <div className="bg-background/80 p-2 rounded-lg border border-border">
              <span className="font-mono font-bold text-foreground">/summary</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Full guest list, pax & wishes</p>
            </div>
            <div className="bg-background/80 p-2 rounded-lg border border-border">
              <span className="font-mono font-bold text-foreground">/help</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Command instructions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5 space-y-1.5">
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

        <div className="md:col-span-7 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="flex-1 min-w-[100px] h-10 text-xs"
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
            className="flex-1 min-w-[90px] h-10 text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {testing ? "Testing…" : "Test Alert"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareQuickSummary}
            disabled={sharingQuick || !chatId}
            className="flex-1 min-w-[110px] h-10 text-xs font-medium"
            title="Share quick headcount overview (/rsvp) to Telegram group"
          >
            <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-gold" />
            {sharingQuick ? "Sending…" : "Quick /rsvp"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleShareDetailList}
            disabled={sharingDetail || !chatId}
            className="flex-1 min-w-[130px] h-10 text-xs bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-medium"
            title="Share complete guest list, individual pax & wishes (/summary) to Telegram group"
          >
            <ListChecks className="h-3.5 w-3.5 mr-1.5" />
            {sharingDetail ? "Sharing…" : "Detail /summary"}
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
