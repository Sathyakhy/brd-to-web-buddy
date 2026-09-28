import { supabase } from "@/integrations/supabase/client";

/**
 * Insert an audit log row for the currently authenticated user.
 * Server-side triggers handle guest CRUD; this helper is for client-only
 * events like login/logout where there is no DB mutation to hook into.
 *
 * Admin/superadmin actions are skipped to keep the log focused on customers.
 */
export async function logAudit(
  action: string,
  details: Record<string, unknown> = {},
  opts: { eventId?: string; entityType?: string; entityId?: string } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Skip admins/superadmins
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const r = (roles ?? []).map(x => x.role);
    if (r.includes("admin") || r.includes("superadmin")) return;

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      action,
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      event_id: opts.eventId ?? null,
      details: details as any,
    });
  } catch (e) {
    // Audit logging should never break the user flow
    console.warn("audit log failed", e);
  }
}
