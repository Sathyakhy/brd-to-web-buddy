import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Determine destination by role
    const { data: { user } } = await supabase.auth.getUser();
    let dest = "/customer";
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const r = (roles ?? []).map(x => x.role);
      if (r.includes("admin") || r.includes("superadmin")) dest = "/admin";
      else if (r.includes("customer")) dest = "/customer";

      // Audit (no-op for admins; logged for customers)
      await logAudit("auth.login", { method: "password" });
    }
    setLoading(false);
    toast.success("Welcome back");
    navigate(dest);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-md bg-gradient-gold flex items-center justify-center text-primary-foreground font-serif font-semibold">21</div>
          <span className="font-serif text-2xl text-gradient-gold">Invitation</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-elegant">
          <div className="text-center mb-6">
            <h1 className="font-serif text-3xl mb-2">Sign in</h1>
            <p className="text-sm text-muted-foreground">Access your events and guest list</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Don't have an account? Accounts are created by your event provider.
          </p>
        </div>

        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-gold mt-6 transition-smooth">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
