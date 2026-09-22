import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import {
  ContactItem, getContactIcon, getContactColor, getContactHref,
} from "@/lib/contacts";

type Props = {
  contacts: ContactItem[];
  /** Accent colour (border, icon, label). Defaults to gold. */
  accentColor?: string;
};

/**
 * Floating contact button (bottom-right) — opens a panel listing every
 * contact entry (phone, Telegram, WhatsApp, Messenger, email, link).
 *
 * The widget stays unobtrusive: it idles at low opacity so it never
 * "sits on top" of content, and only restores to full opacity when the
 * user hovers it or opens the panel.
 */
export default function KhmerFloatingContact({ contacts, accentColor = "#db9b0f" }: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const list = contacts.filter((c) => (c.value ?? "").trim().length > 0);
  if (list.length === 0) return null;

  const active = open || hovered;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      className="fixed bottom-5 right-5 z-[10000] flex flex-col items-end gap-3"
      style={{
        opacity: active ? 1 : 0.35,
        transform: active ? "scale(1)" : "scale(0.92)",
        transition: "opacity .25s ease, transform .25s ease",
      }}
    >
      <div
        className="text-xs font-bold px-2.5 py-1 rounded-md bg-white"
        style={{ color: accentColor, border: `2px solid ${accentColor}` }}
      >
        ទំនាក់ទំនងម្ចាស់កម្មវិធី
      </div>

      <div className="relative">
        {open && (
          <div
            className="absolute bottom-[70px] right-0 min-w-[240px] max-w-[300px] rounded-xl p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
            }}
          >
            {list.map((c) => {
              const Icon = getContactIcon(c.type);
              const color = getContactColor(c.type);
              const href = getContactHref(c);
              const isExternal = href.startsWith("http");
              return (
                <a
                  key={c.id}
                  href={href}
                  {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-black/5 min-w-0"
                  style={{ color: "#333" }}
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}1A`, border: `1px solid ${color}` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    {c.label && (
                      <div className="text-[11px] uppercase tracking-wider font-semibold truncate" style={{ color }}>
                        {c.label}
                      </div>
                    )}
                    <div className="truncate">{c.value}</div>
                  </span>
                </a>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          style={{ border: `2px solid ${accentColor}` }}
          aria-label="Contacts"
          aria-expanded={open}
        >
          <Phone className="h-6 w-6" style={{ color: accentColor }} fill={accentColor} />
        </button>
      </div>
    </div>
  );
}
