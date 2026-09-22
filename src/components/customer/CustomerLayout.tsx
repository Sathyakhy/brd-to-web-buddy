import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CalendarHeart, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logAudit } from "@/lib/audit";

const nav = [
  { to: "/customer", end: true, label: "My events", icon: LayoutDashboard },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, isCustomer, isAdmin, loading } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  if (!isCustomer && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl border border-border bg-card shadow-elegant">
          <h1 className="font-serif text-3xl text-gradient-gold">No events yet</h1>
          <p className="text-muted-foreground text-sm">
            Your account is not linked to any events yet. Please contact your event provider.
          </p>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logAudit("auth.logout", {});
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar">
        <Link to="/customer" className="flex items-center gap-2">
          {settings.logo_url && (
            <img
              src={settings.logo_url}
              alt="Logo"
              className="h-7 w-auto max-w-[40px] object-contain"
            />
          )}
          <span className="font-serif text-xl text-gradient-gold">21Invitation</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-30 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <Link to="/customer" className="flex items-center gap-2">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-8 w-8 object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-gradient-gold flex items-center justify-center text-primary-foreground font-serif font-semibold">
                  21
                </div>
              )}
              <span className="font-serif text-xl text-gradient-gold">Invitation</span>
            </Link>
            <ThemeToggle />
          </div>

          <nav className="flex-1 p-3 space-y-1 mt-14 lg:mt-0">
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-smooth",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border border-gold/20 shadow-soft"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gold/80 hover:text-gold transition-smooth"
              >
                <CalendarHeart className="h-4 w-4" />
                <span>Admin panel</span>
              </NavLink>
            )}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
