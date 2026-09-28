export type EnvelopeStyle =
  | "classic-envelope"
  | "royal-gatefold"
  | "ribbon-unfold"
  | "vintage-pocket"
  | "curtain-reveal";

export type EnvelopeColorTheme =
  | "classic-ivory"
  | "royal-burgundy"
  | "midnight-gold"
  | "emerald-velvet"
  | "blush-rose"
  | "luxury-black"
  | "custom";

export type SealPattern =
  | "monogram"
  | "rings"
  | "heart"
  | "laurel"
  | "crown"
  | "lotus";

export type UnboxingSpeed =
  | "very-fast"
  | "fast"
  | "normal"
  | "slow"
  | "very-slow"
  | "custom";

export type EnvelopeUnboxingConfig = {
  enabled: boolean;
  style: EnvelopeStyle;
  color_theme: EnvelopeColorTheme;
  custom_color?: string | null;
  seal_pattern: SealPattern;
  seal_text?: string | null; // e.g. "VIP" or initials "S & N"
  seal_color?: string | null;
  sound_effects: boolean;
  speed: UnboxingSpeed;
  custom_duration_sec?: number | null; // Custom duration in seconds (0.4s to 4.0s)
  auto_open_delay_ms?: number; // 0 = manual click to open
  show_reopen_button?: boolean;
};

export const DEFAULT_ENVELOPE_CONFIG: EnvelopeUnboxingConfig = {
  enabled: false,
  style: "classic-envelope",
  color_theme: "classic-ivory",
  custom_color: "#faf6ed",
  seal_pattern: "rings",
  seal_text: "",
  seal_color: "#c69214",
  sound_effects: true,
  speed: "normal",
  custom_duration_sec: 1.2,
  auto_open_delay_ms: 0,
  show_reopen_button: false,
};

export const UNBOXING_SPEED_OPTIONS: {
  id: UnboxingSpeed;
  name: string;
  nameKm: string;
  durationSec: number;
  description: string;
  badge: string;
  icon: string;
}[] = [
  {
    id: "very-fast",
    name: "Very Fast",
    nameKm: "លឿនបំផុត (0.6 វិនាទី)",
    durationSec: 0.6,
    description: "Snappy instant reveal (600ms)",
    badge: "0.6s",
    icon: "⚡",
  },
  {
    id: "fast",
    name: "Fast",
    nameKm: "លឿនរហ័ស (0.85 វិនាទី)",
    durationSec: 0.85,
    description: "Brisk & dynamic transition (850ms)",
    badge: "0.85s",
    icon: "⏩",
  },
  {
    id: "normal",
    name: "Normal / Balanced",
    nameKm: "ធម្មតា / តុល្យភាព (1.2 វិនាទី)",
    durationSec: 1.2,
    description: "Smooth elegant motion (1200ms)",
    badge: "1.2s",
    icon: "▶️",
  },
  {
    id: "slow",
    name: "Slow & Cinematic",
    nameKm: "យឺតទន់ភ្លន់ (1.8 វិនាទី)",
    durationSec: 1.8,
    description: "Graceful theatrical unfolding (1800ms)",
    badge: "1.8s",
    icon: "✨",
  },
  {
    id: "very-slow",
    name: "Very Slow / Majestic",
    nameKm: "យឺតរំលេចភាពអធិកអធម (2.5 វិនាទី)",
    durationSec: 2.5,
    description: "Grand regal ceremony effect (2500ms)",
    badge: "2.5s",
    icon: "👑",
  },
  {
    id: "custom",
    name: "Custom Duration",
    nameKm: "កំណត់ថេរវេលាដោយខ្លួនឯង",
    durationSec: 1.2,
    description: "Fine-tune exact animation seconds (0.4s – 4.0s)",
    badge: "Custom",
    icon: "🎛️",
  },
];

export function getUnboxingTiming(config?: Partial<EnvelopeUnboxingConfig> | null): {
  durationSec: number;
  tOpen: number;
  tFade: number;
  speedMultiplier: number;
} {
  const speed = config?.speed || "normal";
  let durationSec = 1.2;

  if (speed === "custom" && typeof config?.custom_duration_sec === "number" && !isNaN(config.custom_duration_sec)) {
    durationSec = Math.max(0.4, Math.min(4.0, config.custom_duration_sec));
  } else {
    const matched = UNBOXING_SPEED_OPTIONS.find((s) => s.id === speed);
    durationSec = matched ? matched.durationSec : 1.2;
  }

  const tOpen = Math.round(durationSec * 1000);
  const tFade = Math.max(250, Math.round(tOpen * 0.38));
  const speedMultiplier = durationSec / 1.2;

  return {
    durationSec,
    tOpen,
    tFade,
    speedMultiplier,
  };
}

export const ENVELOPE_STYLES: {
  id: EnvelopeStyle;
  name: string;
  nameKm: string;
  description: string;
  badge: string;
}[] = [
  {
    id: "classic-envelope",
    name: "3D Wax Seal Envelope",
    nameKm: "ស្រោមសំបុត្រ 3D បោះត្រាក្រមួនមាស",
    description: "Classic parchment envelope with 3D folding flap, embossed wax stamp, and letter sliding out.",
    badge: "Most Popular",
  },
  {
    id: "royal-gatefold",
    name: "Royal Palace Gatefold / Double Doors",
    nameKm: "ទ្វាររាជវាំង 3D បើកសងខាង",
    description: "Majestic double French doors with gold filigree handles swinging outward in 3D perspective.",
    badge: "Grand & Regal",
  },
  {
    id: "ribbon-unfold",
    name: "Silk Ribbon Gift Box Unboxing",
    nameKm: "ប្រអប់កាដូខ្សែបូសូត្រ 3D",
    description: "Luxurious satin ribbon bow untying and sliding away as the box lid elevates in 3D.",
    badge: "Luxury",
  },
  {
    id: "vintage-pocket",
    name: "Vintage Lace Trifold Pocket",
    nameKm: "ស្រោមប៉ាក់ក្បាច់បុរាណ 3D",
    description: "Intricate laser-cut gold lace wings parting outward to reveal the golden stationery.",
    badge: "Vintage Gold",
  },
  {
    id: "curtain-reveal",
    name: "Grand Velvet Theatre Curtains",
    nameKm: "វាំងននមហោស្រព 3D បើកសម្ពោធ",
    description: "Dramatic velvet drapes sweeping open with golden tie-backs and theatrical lighting.",
    badge: "Cinematic",
  },
];

export const COLOR_THEMES: {
  id: EnvelopeColorTheme;
  name: string;
  bg: string;
  accent: string;
  border: string;
  sealDefault: string;
}[] = [
  {
    id: "classic-ivory",
    name: "Classic Ivory & Gold",
    bg: "linear-gradient(135deg, #fffef9 0%, #f7f1e1 50%, #ede3cb 100%)",
    accent: "#c69214",
    border: "#d8c49d",
    sealDefault: "#c69214",
  },
  {
    id: "royal-burgundy",
    name: "Royal Burgundy Velvet",
    bg: "linear-gradient(135deg, #5b111e 0%, #3e0a13 50%, #26050a 100%)",
    accent: "#f5d77f",
    border: "#851e30",
    sealDefault: "#d49b28",
  },
  {
    id: "midnight-gold",
    name: "Midnight Navy & 24K Gold",
    bg: "linear-gradient(135deg, #131c31 0%, #0d1322 50%, #060911 100%)",
    accent: "#ffd700",
    border: "#253759",
    sealDefault: "#e6b422",
  },
  {
    id: "emerald-velvet",
    name: "Imperial Emerald & Brass",
    bg: "linear-gradient(135deg, #093824 0%, #052618 50%, #02140c 100%)",
    accent: "#e5c158",
    border: "#135437",
    sealDefault: "#d4a937",
  },
  {
    id: "blush-rose",
    name: "Romantic Blush & Pearl",
    bg: "linear-gradient(135deg, #fff2f4 0%, #fde2e4 50%, #fcd5ce 100%)",
    accent: "#e07a5f",
    border: "#f8bbd0",
    sealDefault: "#e56b6f",
  },
  {
    id: "luxury-black",
    name: "Onyx Matte & Rose Gold",
    bg: "linear-gradient(135deg, #1f1f1f 0%, #141414 50%, #080808 100%)",
    accent: "#e0a96d",
    border: "#333333",
    sealDefault: "#cca43b",
  },
  {
    id: "custom",
    name: "Custom Palette",
    bg: "linear-gradient(135deg, #fbf8f1 0%, #ede4d1 100%)",
    accent: "#c69214",
    border: "#d8c49d",
    sealDefault: "#c69214",
  },
];

export const SEAL_PATTERNS: { id: SealPattern; name: string; icon: string }[] = [
  { id: "rings", name: "Wedding Rings", icon: "💍" },
  { id: "heart", name: "Double Hearts", icon: "❤️" },
  { id: "lotus", name: "Khmer Lotus / ផ្កាឈូក", icon: "🪷" },
  { id: "crown", name: "Royal Crown", icon: "👑" },
  { id: "laurel", name: "Golden Laurel Wreath", icon: "🌿" },
  { id: "monogram", name: "Monogram / Custom Text", icon: "✨" },
];

export function normalizeEnvelopeConfig(raw?: any): EnvelopeUnboxingConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_ENVELOPE_CONFIG };
  }
  const validSpeeds: UnboxingSpeed[] = ["very-fast", "fast", "normal", "slow", "very-slow", "custom"];
  const speed: UnboxingSpeed = validSpeeds.includes(raw.speed)
    ? raw.speed
    : DEFAULT_ENVELOPE_CONFIG.speed;

  let custom_duration_sec = DEFAULT_ENVELOPE_CONFIG.custom_duration_sec;
  if (typeof raw.custom_duration_sec === "number" && !isNaN(raw.custom_duration_sec)) {
    custom_duration_sec = Math.max(0.4, Math.min(4.0, Number(raw.custom_duration_sec.toFixed(2))));
  }

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : false,
    style: ENVELOPE_STYLES.some((s) => s.id === raw.style)
      ? raw.style
      : DEFAULT_ENVELOPE_CONFIG.style,
    color_theme: COLOR_THEMES.some((c) => c.id === raw.color_theme)
      ? raw.color_theme
      : DEFAULT_ENVELOPE_CONFIG.color_theme,
    custom_color: typeof raw.custom_color === "string" ? raw.custom_color : null,
    seal_pattern: SEAL_PATTERNS.some((p) => p.id === raw.seal_pattern)
      ? raw.seal_pattern
      : DEFAULT_ENVELOPE_CONFIG.seal_pattern,
    seal_text: typeof raw.seal_text === "string" ? raw.seal_text : "",
    seal_color: typeof raw.seal_color === "string" ? raw.seal_color : null,
    sound_effects: typeof raw.sound_effects === "boolean" ? raw.sound_effects : true,
    speed,
    custom_duration_sec,
    auto_open_delay_ms: typeof raw.auto_open_delay_ms === "number" ? raw.auto_open_delay_ms : 0,
    show_reopen_button: typeof raw.show_reopen_button === "boolean" ? raw.show_reopen_button : false,
  };
}

/**
 * Web Audio API synthesizer for tactile unboxing sound effects.
 * Synthesizes wax crackle, paper flap swoosh, and sparkling chime without downloading external mp3 files.
 */
class EnvelopeAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playUnboxSound(style: EnvelopeStyle = "classic-envelope") {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (style === "classic-envelope") {
        // 1. Wax crackle / click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);

        // 2. Paper slide swoosh
        this.playPaperSwoosh(now + 0.15);

        // 3. Golden bell chime
        this.playGoldenChime(now + 0.4);
      } else if (style === "royal-gatefold") {
        // Heavy royal palace door creak & golden chime
        this.playDoorCreak(now);
        this.playGoldenChime(now + 0.5);
      } else if (style === "ribbon-unfold") {
        // Silky ribbon untying + gentle harp chime
        this.playPaperSwoosh(now);
        this.playGoldenChime(now + 0.35);
      } else if (style === "curtain-reveal") {
        // Dramatic velvet sweep + royal harp
        this.playPaperSwoosh(now);
        this.playGoldenChime(now + 0.5);
      } else {
        // Vintage lace pocket
        this.playPaperSwoosh(now);
        this.playGoldenChime(now + 0.35);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }

  private playPaperSwoosh(startTime: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.linearRampToValueAtTime(2400, startTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + 0.35);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(startTime);
  }

  private playGoldenChime(startTime: number) {
    if (!this.ctx) return;
    const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6 harmony
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.05);

      gain.gain.setValueAtTime(0.08 / (idx + 1), startTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.05 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startTime + idx * 0.05);
      osc.stop(startTime + idx * 0.05 + 1.3);
    });
  }

  private playDoorCreak(startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, startTime);
    osc.frequency.linearRampToValueAtTime(160, startTime + 0.4);
    osc.frequency.linearRampToValueAtTime(90, startTime + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, startTime);

    gain.gain.setValueAtTime(0.04, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.95);
  }
}

export const envelopeAudio = new EnvelopeAudioSynthesizer();
