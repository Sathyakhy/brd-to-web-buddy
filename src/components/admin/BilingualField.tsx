import { ReactNode, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline as UnderlineIcon, Eye } from "lucide-react";
import { renderFormattedText } from "@/lib/formatText";

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
  allowFormatting?: boolean;
}

function insertFormatting(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  prefix: string,
  suffix: string,
  onChange: (val: string) => void
) {
  if (!textarea) {
    onChange(`${currentValue} ${prefix}text${suffix}`);
    return;
  }
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const selected = currentValue.substring(start, end);
  const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
  const nextValue = currentValue.substring(0, start) + replacement + currentValue.substring(end);
  onChange(nextValue);
  setTimeout(() => {
    textarea.focus();
    if (selected) {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    } else {
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + 4);
    }
  }, 0);
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
  allowFormatting = true,
}: BilingualTextareaProps) {
  const kmRef = useRef<HTMLTextAreaElement | null>(null);
  const enRef = useRef<HTMLTextAreaElement | null>(null);

  const hasKmFormatting = /[*_<>]/g.test(kmValue || "");
  const hasEnFormatting = /[*_<>]/g.test(enValue || "");

  if (!isDual) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {allowFormatting && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Apply Bold (**text**)"
                onClick={() => insertFormatting(kmRef.current, kmValue ?? "", "**", "**", onKmChange)}
              >
                <Bold className="h-3 w-3 mr-0.5" />
                <span className="text-[10px]">Bold</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Apply Italic (*text*)"
                onClick={() => insertFormatting(kmRef.current, kmValue ?? "", "*", "*", onKmChange)}
              >
                <Italic className="h-3 w-3 mr-0.5" />
                <span className="text-[10px]">Italic</span>
              </Button>
            </div>
          )}
        </div>
        <Textarea
          ref={kmRef}
          rows={rows}
          value={kmValue ?? ""}
          onChange={(e) => onKmChange(e.target.value)}
          placeholder={placeholderKm}
          className={textareaClassName}
        />
        {hasKmFormatting && (
          <div className="rounded p-2 bg-secondary/30 border border-border/50 text-xs">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono mb-1">
              <Eye className="h-3 w-3" /> Live Formatted Preview
            </div>
            <div className="text-foreground leading-relaxed">
              {renderFormattedText(kmValue)}
            </div>
          </div>
        )}
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
        {/* Khmer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
              <span className="text-sm">🇰🇭</span> Khmer Content
            </div>
            {allowFormatting && (
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  title="Wrap in **bold**"
                  onClick={() => insertFormatting(kmRef.current, kmValue ?? "", "**", "**", onKmChange)}
                >
                  <Bold className="h-2.5 w-2.5 mr-0.5" /> Bold
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  title="Wrap in *italic*"
                  onClick={() => insertFormatting(kmRef.current, kmValue ?? "", "*", "*", onKmChange)}
                >
                  <Italic className="h-2.5 w-2.5 mr-0.5" /> Italic
                </Button>
              </div>
            )}
          </div>
          <Textarea
            ref={kmRef}
            rows={rows}
            value={kmValue ?? ""}
            onChange={(e) => onKmChange(e.target.value)}
            placeholder={placeholderKm || "ខ្លឹមសារជាភាសាខ្មែរ…"}
            className={`font-khmer-siemreap ${textareaClassName}`}
          />
          {hasKmFormatting && (
            <div className="rounded p-2 bg-background/80 border border-border/60 text-xs">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono mb-0.5">
                <Eye className="h-3 w-3" /> Formatted Preview
              </div>
              <div className="text-foreground leading-relaxed font-khmer-siemreap">
                {renderFormattedText(kmValue)}
              </div>
            </div>
          )}
        </div>

        {/* English */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
              <span className="text-sm">🇬🇧</span> English Content
            </div>
            {allowFormatting && (
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  title="Wrap in **bold**"
                  onClick={() => insertFormatting(enRef.current, enValue ?? "", "**", "**", (val) => onEnChange?.(val))}
                >
                  <Bold className="h-2.5 w-2.5 mr-0.5" /> Bold
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  title="Wrap in *italic*"
                  onClick={() => insertFormatting(enRef.current, enValue ?? "", "*", "*", (val) => onEnChange?.(val))}
                >
                  <Italic className="h-2.5 w-2.5 mr-0.5" /> Italic
                </Button>
              </div>
            )}
          </div>
          <Textarea
            ref={enRef}
            rows={rows}
            value={enValue ?? ""}
            onChange={(e) => onEnChange?.(e.target.value)}
            placeholder={placeholderEn || "Content in English…"}
            className={textareaClassName}
          />
          {hasEnFormatting && (
            <div className="rounded p-2 bg-background/80 border border-border/60 text-xs">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono mb-0.5">
                <Eye className="h-3 w-3" /> Formatted Preview
              </div>
              <div className="text-foreground leading-relaxed">
                {renderFormattedText(enValue)}
              </div>
            </div>
          )}
        </div>
      </div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}
