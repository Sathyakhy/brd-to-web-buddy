import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is admin or superadmin
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const callerRoleSet = new Set((callerRoles ?? []).map((r) => r.role));
    const callerIsAdmin = callerRoleSet.has("admin") || callerRoleSet.has("superadmin");
    const callerIsSuperadmin = callerRoleSet.has("superadmin");
    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { user_id, email, password, display_name, role } = body as {
      user_id: string;
      email?: string;
      password?: string;
      display_name?: string;
      role?: "admin" | "superadmin" | "customer" | null;
    };

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate inputs
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (password !== undefined && password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (display_name !== undefined && display_name.length > 100) {
      return new Response(JSON.stringify({ error: "Display name too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update auth user (email/password)
    const authUpdates: Record<string, unknown> = {};
    if (email !== undefined) authUpdates.email = email;
    if (password !== undefined && password.length > 0) authUpdates.password = password;
    if (Object.keys(authUpdates).length > 0) {
      const { error: updErr } = await admin.auth.admin.updateUserById(user_id, authUpdates);
      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update profile (display_name + email mirror)
    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) profileUpdates.display_name = display_name;
    if (email !== undefined) profileUpdates.email = email;
    if (Object.keys(profileUpdates).length > 1) {
      await admin.from("profiles").update(profileUpdates).eq("user_id", user_id);
    }

    // Manage role: replace the user's primary role with the requested one.
    // The three primary roles are mutually exclusive in this UI.
    if (role !== undefined) {
      const PRIMARY_ROLES = ["admin", "superadmin", "customer"] as const;

      // Only existing superadmins may grant or revoke the superadmin role.
      const targetIsSuperadminToday =
        (await admin.from("user_roles").select("role").eq("user_id", user_id).eq("role", "superadmin").maybeSingle())
          .data != null;
      if ((role === "superadmin" || targetIsSuperadminToday) && !callerIsSuperadmin) {
        return new Response(JSON.stringify({ error: "Only superadmins can manage the superadmin role" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Safety: prevent caller from demoting themselves out of admin/superadmin.
      if (
        user_id === userData.user.id &&
        role !== "admin" &&
        role !== "superadmin"
      ) {
        return new Response(JSON.stringify({ error: "You cannot remove your own admin role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (role === null) {
        // Strip the customer role only — never accidentally clear admin/superadmin here.
        await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "customer");
      } else if ((PRIMARY_ROLES as readonly string[]).includes(role)) {
        // Remove all other primary roles, then upsert the requested one.
        const others = PRIMARY_ROLES.filter((r) => r !== role);
        await admin.from("user_roles").delete().eq("user_id", user_id).in("role", others);
        await admin.from("user_roles").upsert(
          { user_id, role },
          { onConflict: "user_id,role" }
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-update-customer error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
