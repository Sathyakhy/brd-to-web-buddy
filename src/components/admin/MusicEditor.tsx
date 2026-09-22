import { useState, useRef } from "react";
import { Music, Upload, Trash2, Play, Pause, ExternalLink, Link2, Sparkles, Check, Disc3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MUSIC_PRESETS, MusicPreset } from "@/lib/musicPresets";
import { toast } from "sonner";

type Props = {
  musicUrl: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
};

export default function MusicEditor({ musicUrl, onChange, onUpload, uploading }: Props) {
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [previewingPresetId, setPreviewingPresetId] = useState<string | null>(null);
  const presetAudioRef = useRef<HTMLAudioElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid audio URL");
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    onChange(trimmed);
    setCustomUrlInput("");
    toast.success("Background music URL applied");
  };

  const togglePresetPreview = (preset: MusicPreset) => {
    if (previewingPresetId === preset.id) {
      presetAudioRef.current?.pause();
      setPreviewingPresetId(null);
    } else {
      if (presetAudioRef.current) {
        presetAudioRef.current.pause();
      }
      const audio = new Audio(preset.url);
      presetAudioRef.current = audio;
      audio.volume = 0.6;
      audio.play().catch(() => toast.error("Could not play audio preview"));
      audio.onended = () => setPreviewingPresetId(null);
      setPreviewingPresetId(preset.id);
    }
  };

  const handleSelectPreset = (preset: MusicPreset) => {
    if (presetAudioRef.current) {
      presetAudioRef.current.pause();
      setPreviewingPresetId(null);
    }
    onChange(preset.url);
    toast.success(`Selected "${preset.title}"`);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      onUpload(file);
    } else if (file) {
      toast.error("Please drop an audio file (.mp3, .m4a, .ogg)");
    }
  };

  const currentPresetMatch = MUSIC_PRESETS.find((p) => p.url === musicUrl);

  return (
    <div className="space-y-6 pt-2">
      {/* Current Active Music Status Card */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              musicUrl ? "bg-primary/10 border border-primary/30 text-primary" : "bg-muted border border-border text-muted-foreground"
            }`}>
              <Disc3 className={`h-6 w-6 ${musicUrl ? "animate-[spin_4s_linear_infinite]" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground">
                  {musicUrl ? (currentPresetMatch?.title ?? "Custom background track active") : "No background music active"}
                </h4>
                {musicUrl && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                    Live on Invite
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                {musicUrl
                  ? (currentPresetMatch ? currentPresetMatch.description : musicUrl)
                  : "Choose an MP3 upload, preset song, or direct URL below to play ambient music for guests."}
              </p>
            </div>
          </div>

          {musicUrl && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  onChange(null);
                  toast.success("Background music removed");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove track
              </Button>
            </div>
          )}
        </div>

        {/* Audio Player bar for current track */}
        {musicUrl && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <audio src={musicUrl} controls className="w-full h-9 rounded-lg" preload="metadata" />
              <a
                href={musicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open audio source
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for Configuration Methods */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload MP3
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-xs gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Music Presets
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Direct URL
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: File Upload */}
        <TabsContent value="upload" className="mt-4 space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
              dragOver ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/50 bg-secondary/30"
            }`}
          >
            <div className="max-w-sm mx-auto flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Music className="h-6 w-6" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-foreground">Upload your own audio file</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag & drop an MP3, M4A, or OGG file here, or click to browse.
                </p>
              </div>

              <Label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-smooth shadow-sm">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading audio..." : "Select audio file"}
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/m4a,audio/ogg,audio/wav"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                  }}
                />
              </Label>
              <span className="text-[11px] text-muted-foreground">Supported formats: MP3, M4A, OGG · Max 15 MB</span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Curated Presets */}
        <TabsContent value="presets" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-3">
            Choose from ready-to-use royalty-free wedding melodies and romantic instrumentals. Listen to a preview or select with one click.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MUSIC_PRESETS.map((preset) => {
              const isSelected = musicUrl === preset.url;
              const isPlayingPreview = previewingPresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/70 bg-card/40 hover:border-border hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-foreground">{preset.title}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                          {preset.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePresetPreview(preset)}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="h-3 w-3 text-primary animate-pulse" />
                          Stop preview
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Listen
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isSelected}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3 w-3 text-primary-foreground" />
                          Selected
                        </>
                      ) : (
                        "Select track"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: Direct URL */}
        <TabsContent value="url" className="mt-4 space-y-3">
          <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 sm:p-5 space-y-3">
            <Label className="text-xs font-medium text-foreground">
              Direct Audio File Link (MP3 / M4A / OGG)
            </Label>
            <p className="text-xs text-muted-foreground">
              Have your audio hosted on Google Cloud, Amazon S3, Cloudflare R2, or a public server? Paste the direct audio URL below.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                placeholder="https://example.com/audio/wedding-melody.mp3"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="text-xs font-mono"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleApplyCustomUrl}
                className="shrink-0 text-xs"
              >
                Apply URL
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Note: Must be a direct streamable audio link ending in .mp3, .m4a, or .ogg (not a webpage link).
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile Browser Autoplay Advisory */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">How music plays on guests' phones: </span>
          iOS Safari and Android Chrome prevent unmuted audio from playing completely unprompted. The floating music disc automatically starts playing the moment your guest touches the screen or opens the invitation. Guests can tap the disc anytime to pause or mute.
        </div>
      </div>
    </div>
  );
}
