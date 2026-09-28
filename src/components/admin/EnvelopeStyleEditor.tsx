import { useState } from "react";
import {
  EnvelopeConfig,
  SILK_THEMES,
  WAX_SEAL_TYPES,
  RIBBON_STYLES,
  normalizeEnvelopeConfig,
} from "@/lib/envelopeConfig";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Play, Volume2, ShieldCheck, Palette } from "lucide-react";
import Interactive3DEnvelope from "@/components/templates/Interactive3DEnvelope";

type Props = {
  config?: Partial<EnvelopeConfig> | null;
  onChange: (config: EnvelopeConfig) => void;
  guestName?: string;
  eventTitle?: string;
};

export default function EnvelopeStyleEditor({
  config,
  onChange,
  guestName = "ឯកឧត្តម និងលោកជំទាវ",
  eventTitle = "អាពាហ៍ពិពាហ៍មង្គល",
}: Props) {
  const cfg = normalizeEnvelopeConfig(config);
  const [showLiveModal, setShowLiveModal] = useState(false);

  const update = (partial: Partial<EnvelopeConfig>) => {
    onChange({
      ...cfg,
      ...partial,
    });
  };

  return (
    <div className="space-y-6">
      {/* Enable 3D Silk Envelope Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <Label className="text-sm font-semibold">3D Silk Envelope Unboxing Ritual</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Realistic Cambodian silk-textured envelope with wax seal, ribbon peel, and sound effects before entering the invitation.
          </p>
        </div>
        <Switch
          checked={cfg.enabled}
          onCheckedChange={(enabled) => update({ enabled })}
        />
      </div>

      {cfg.enabled && (
        <div className="space-y-5 pt-2">
          {/* Silk Color Theme Selection */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cambodian Silk Color Theme
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SILK_THEMES.map((theme) => {
                const active = cfg.silk_theme === theme.id && !cfg.custom_silk_color;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => update({ silk_theme: theme.id, custom_silk_color: null })}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      active
                        ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10 font-medium"
                        : "border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full shrink-0 border border-white/30 shadow-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs truncate font-medium text-foreground">{theme.nameKm}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{theme.nameEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wax Seal Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Wax Seal Motif</Label>
              <Select
                value={cfg.wax_seal_type}
                onValueChange={(val) => update({ wax_seal_type: val as any })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAX_SEAL_TYPES.map((seal) => (
                    <SelectItem key={seal.id} value={seal.id} className="text-xs">
                      {seal.iconSymbol} {seal.nameKm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Wax Seal Material / Color</Label>
              <Select
                value={cfg.wax_seal_color || "gold"}
                onValueChange={(val) => update({ wax_seal_color: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold" className="text-xs">✨ Burnished Gold (មាសបុរាណ)</SelectItem>
                  <SelectItem value="ruby" className="text-xs">🔴 Ruby Red Wax (ក្រហមកែវ)</SelectItem>
                  <SelectItem value="emerald" className="text-xs">🟢 Emerald Jade Wax (ត្បូងមរកត)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monogram Initials for Seal */}
          {cfg.wax_seal_type === "khmer_monogram" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Seal Monogram Initials (អក្សរកាត់មង្គល)</Label>
              <Input
                value={cfg.monogram_initials || ""}
                onChange={(e) => update({ monogram_initials: e.target.value })}
                placeholder="ស · រ"
                className="font-khmer-moul text-sm max-w-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Khmer couple initials embossed into the 3D gold/ruby wax seal.
              </p>
            </div>
          )}

          {/* Ribbon Style Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Silk Ribbon Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RIBBON_STYLES.map((r) => {
                const active = cfg.ribbon_style === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => update({ ribbon_style: r.id })}
                    className={`px-3 py-2 rounded-lg border text-center transition-all ${
                      active
                        ? "border-amber-500 bg-amber-500/10 text-amber-500 font-medium"
                        : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs truncate">{r.nameKm}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Guest Name Badge</Label>
                <p className="text-[11px] text-muted-foreground">Show guest name on envelope front</p>
              </div>
              <Switch
                checked={cfg.show_guest_name}
                onCheckedChange={(show_guest_name) => update({ show_guest_name })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Unboxing Sound Effects</Label>
                <p className="text-[11px] text-muted-foreground">Tactile wax crack & silk slide sound</p>
              </div>
              <Switch
                checked={cfg.unboxing_sound}
                onCheckedChange={(unboxing_sound) => update({ unboxing_sound })}
              />
            </div>
          </div>

          {/* Interactive Test Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowLiveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Test Interactive 3D Unboxing Experience</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Interactive Test Modal */}
      {showLiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg aspect-[9/16] sm:aspect-[4/5] max-h-[85vh] rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl">
            <Interactive3DEnvelope
              guestName={guestName}
              title={eventTitle}
              eventDate="ថ្ងៃអាទិត្យ ទី១៥ ខែវិច្ឆិកា ឆ្នាំ២០២៦"
              config={cfg}
              positionMode="absolute"
              allowReplay
              onOpen={() => {
                // Keep open or let user replay
              }}
            />
            <button
              type="button"
              onClick={() => setShowLiveModal(false)}
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs border border-white/20 hover:bg-black"
            >
              Close Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
