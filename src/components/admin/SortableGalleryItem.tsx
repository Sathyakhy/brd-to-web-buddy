import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { thumbUrl } from "@/lib/imageUrl";

/**
 * Reusable sortable gallery thumbnail used in both the Event editor and the
 * Template editor. Same look & feel as the original inline component.
 */
export default function SortableGalleryItem({
  id, url, index, onRemove, className,
}: {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : "auto",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-md overflow-hidden border bg-muted/40 ${className ?? "aspect-square"} ${isDragging ? "border-gold shadow-lg" : "border-border"}`}
    >
      <img
        src={thumbUrl(url, 240)}
        alt={`gallery-${index}`}
        className="h-full w-full object-cover object-center pointer-events-none select-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/55 text-white text-[10px] leading-none">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Remove"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
