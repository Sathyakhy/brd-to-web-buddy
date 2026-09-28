import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TemplateSummary = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  base_renderer: string;
  is_active: boolean;
  position: number;
};

/**
 * Fetches the admin-curated list of invitation templates from the DB.
 *
 * Returns *active* templates by default — used by the event picker. Pass
 * `includeInactive: true` (admin pages) to also receive disabled templates.
 *
 * The renderer key still comes from each template's `base_renderer` (or the
 * `slug` for the seeded built-ins), so the React renderer switch can stay as
 * is: only the picker labels and metadata are dynamic.
 */
export function useTemplates(opts: { includeInactive?: boolean } = {}) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("templates")
        .select("id, slug, label, description, base_renderer, is_active, position")
        .order("position", { ascending: true });
      if (!opts.includeInactive) q = q.eq("is_active", true);
      const { data } = await q;
      if (cancelled) return;
      setTemplates((data ?? []) as TemplateSummary[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [opts.includeInactive]);

  return { templates, loading };
}
