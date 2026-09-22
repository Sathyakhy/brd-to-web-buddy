import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BilingualInputProps {
  label: string;
  description?: ReactNode;
  isDual?: boolean;
  kmValue: string;
  enValue?: string;
  onKmChange: (value: string) => void;
  onEnChange?: (value: string) => void;
  placeholderKm?: string;
  placeholderEn?: string;
  className?: string;
  inputClassName?: string;
  type?: string;
}

export function BilingualInput({
  label,
  description,
  isDual = false,
  kmValue,
  enValue = "",
  onKmChange,
  onEnChange,
  placeholderKm,
  placeholderEn,
  className = "",
  inputClassName = "",
  type = "text",
}: BilingualInputProps) {
  if (!isDual) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <Input
          type={type}
          value={kmValue ?? ""}
          onChange={(e) => onKmChange(e.target.value)}
          placeholder={placeholderKm}
          className={inputClassName}
        />
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
          Bilingual
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-secondary/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span className="text-sm">🇰🇭</span> Khmer Content
          </div>
          <Input
            type={type}
            value={kmValue ?? ""}
            onChange={(e) => onKmChange(e.target.value)}
            placeholder={placeholderKm || "ខ្លឹមសារជាភាសាខ្មែរ…"}
            className={`font-khmer-siemreap ${inputClassName}`}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span className="text-sm">🇬🇧</span> English Content
          </div>
          <Input
            type={type}
            value={enValue ?? ""}
            onChange={(e) => onEnChange?.(e.target.value)}
            placeholder={placeholderEn || "Content in English…"}
            className={inputClassName}
          />
        </div>
      </div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}

interface BilingualTextareaProps {
  label: string;
  description?: ReactNode;
  isDual?: boolean;
  kmValue: string;
  enValue?: string;
  onKmChange: (value: string) => void;
  onEnChange?: (value: string) => void;
  placeholderKm?: string;
  placeholderEn?: string;
  rows?: number;
  className?: string;
  textareaClassName?: string;
}

export function BilingualTextarea({
  label,
  description,
  isDual = false,
  kmValue,
  enValue = "",
  onKmChange,
  onEnChange,
  placeholderKm,
  placeholderEn,
  rows = 3,
  className = "",
  textareaClassName = "",
}: BilingualTextareaProps) {
  if (!isDual) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <Textarea
          rows={rows}
          value={kmValue ?? ""}
          onChange={(e) => onKmChange(e.target.value)}
          placeholder={placeholderKm}
          className={textareaClassName}
        />
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
          Bilingual
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-secondary/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span className="text-sm">🇰🇭</span> Khmer Content
          </div>
          <Textarea
            rows={rows}
            value={kmValue ?? ""}
            onChange={(e) => onKmChange(e.target.value)}
            placeholder={placeholderKm || "ខ្លឹមសារជាភាសាខ្មែរ…"}
            className={`font-khmer-siemreap ${textareaClassName}`}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span className="text-sm">🇬🇧</span> English Content
          </div>
          <Textarea
            rows={rows}
            value={enValue ?? ""}
            onChange={(e) => onEnChange?.(e.target.value)}
            placeholder={placeholderEn || "Content in English…"}
            className={textareaClassName}
          />
        </div>
      </div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}
