import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, CalendarDays, Users, LogOut, Menu, X, Palette,
  PanelLeftClose, PanelLeftOpen, Library, Settings, Receipt, FileBarChart,
  ShieldCheck, ScrollText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

// Sidebar navigation, grouped into sections so admin tools, people, and
// billing tools are visually separated. `match` lets us mark a row active
// based on both pathname and query string (used to split the Users page
// into "Admin users" vs "Customers" while pointing at the same route).
type NavItem = {
  to: string;
  end?: boolean;
  label: string;
  icon: any;
  match?: (pathname: string, search: string) => boolean;
};
const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Admin",
    items: [
      { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/events", label: "Events", icon: CalendarDays },
      { to: "/admin/templates", label: "Templates", icon: Palette },
      { to: "/admin/asset-library", label: "Asset Library", icon: Library },
      { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
      { to: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    label: "People",
    items: [
      {
        to: "/admin/users?role=admin",
        label: "Admin users",
        icon: ShieldCheck,
        match: (p, s) => p === "/admin/users" && /(^|[?&])role=(admin|superadmin)(&|$)/.test(s),
      },
      {
        to: "/admin/users?role=customer",
        label: "Customers",
        icon: Users,
        match: (p, s) => p === "/admin/users" && /(^|[?&])role=customer(&|$)/.test(s),
      },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/admin/billing", label: "Billing", icon: Receipt },
      { to: "/admin/reports", label: "Sales Report", icon: FileBarChart },
    ],
  },
];

const COLLAPSE_KEY = "admin.sidebar.collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Desktop collapsed state — persists across navigation so collapsing doesn't
  // reset when the user clicks a menu item (NavLink already does SPA nav,
  // so the page itself never refreshes).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    try { window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl border border-border bg-card shadow-elegant">
          <h1 className="font-serif text-3xl text-gradient-gold">Admin access required</h1>
          <p className="text-muted-foreground text-sm">
            Your account is signed in but isn't an administrator.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/customer")}>Go to customer area</Button>
            <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar">
        <Link to="/admin" className="flex items-center gap-2">
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
          "fixed lg:sticky top-0 left-0 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          // Mobile is always a full-width drawer; desktop honours collapsed state.
          // Tailwind cannot interpolate dynamic class names, so we map explicitly.
          "w-64",
          collapsed ? "lg:w-16" : "lg:w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="hidden lg:flex h-16 items-center justify-between px-3 border-b border-sidebar-border">
            <Link to="/admin" className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center w-full")}>
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-8 w-8 object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-gradient-gold flex items-center justify-center text-primary-foreground font-serif font-semibold shrink-0">
                  21
                </div>
              )}
              {!collapsed && <span className="font-serif text-xl text-gradient-gold truncate">Invitation</span>}
            </Link>
            {!collapsed && <ThemeToggle />}
          </div>

          <nav className="flex-1 p-3 space-y-4 mt-14 lg:mt-0 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={section.label} className="space-y-1">
                {/* Section label — hidden when collapsed; rendered as a thin
                    divider instead so the visual grouping is preserved. */}
                {!collapsed ? (
                  <div className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">
                    {section.label}
                  </div>
                ) : idx > 0 ? (
                  <div className="mx-2 my-2 border-t border-sidebar-border/60" aria-hidden />
                ) : null}
                {section.items.map(item => {
                  // Manual `match` overrides NavLink's default pathname check
                  // (needed when two items share the same route but differ
                  // by query string, e.g. ?role=admin vs ?role=customer).
                  const manualActive = item.match
                    ? item.match(location.pathname, location.search)
                    : null;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => {
                        const active = manualActive !== null ? manualActive : isActive;
                        return cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-smooth",
                          collapsed && "lg:justify-center lg:px-2",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-gold/20 shadow-soft"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        );
                      }}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-sidebar-border space-y-1">
            {!collapsed && (
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
            )}
            <Button
              variant="ghost"
              className={cn(
                "w-full text-sidebar-foreground hover:text-destructive",
                collapsed ? "lg:justify-center lg:px-0" : "justify-start"
              )}
              onClick={handleLogout}
              title={collapsed ? "Sign out" : undefined}
            >
              <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && <span>Sign out</span>}
            </Button>
            {/* Desktop-only collapse toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden lg:flex w-full text-sidebar-foreground",
                collapsed ? "lg:justify-center lg:px-0" : "justify-start"
              )}
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : (
                <>
                  <PanelLeftClose className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
