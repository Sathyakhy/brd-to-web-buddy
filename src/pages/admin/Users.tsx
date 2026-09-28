import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, RefreshCw, UserPlus, Link2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import ListToolbar from "@/components/admin/ListToolbar";

type Profile = {
  user_id: string; email: string | null; display_name: string | null; created_at: string;
};
type Role = { user_id: string; role: string };
type Event = { id: string; title: string; slug: string };
type EventCustomer = { user_id: string; event_id: string };

export default function Users() {
  const { user: currentUser, isSuperadmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [links, setLinks] = useState<EventCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / filter / sort. The role filter can also be driven by a `?role=`
  // URL param so the sidebar can deep-link to "Admin users" vs "Customers".
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(() => searchParams.get("role") ?? "all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  // Keep filter in sync when navigating to the same page with a new ?role=.
  useEffect(() => {
    const next = searchParams.get("role") ?? "all";
    setRoleFilter(prev => (prev === next ? prev : next));
  }, [searchParams]);

  // Persist filter changes back to the URL so refresh / share keeps the view.
  const updateRoleFilter = (v: string) => {
    setRoleFilter(v);
    const next = new URLSearchParams(searchParams);
    if (v === "all") next.delete("role");
    else next.set("role", v);
    setSearchParams(next, { replace: true });
  };

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Assign dialog state
  const [assignFor, setAssignFor] = useState<Profile | null>(null);
  const [assignSet, setAssignSet] = useState<Set<string>>(new Set());

  // Edit dialog state
  const [editFor, setEditFor] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "superadmin" | "customer">("customer");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, r, e, l] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("events").select("id, title, slug").order("created_at", { ascending: false }),
      supabase.from("event_customers").select("user_id, event_id"),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setRoles((r.data ?? []) as Role[]);
    setEvents((e.data ?? []) as Event[]);
    setLinks((l.data ?? []) as EventCustomer[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEmail(""); setPassword(""); setDisplayName(""); setSelectedEvents([]);
  };

  const securePassword = (length = 12) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => chars[b % chars.length]).join("");
  };

  const generatePassword = () => {
    setPassword(securePassword(12));
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-customer", {
      body: { email, password, display_name: displayName, event_ids: selectedEvents },
    });
    setCreating(false);
    if (error || (data && (data as any).error)) {
      toast.error((data as any)?.error ?? error?.message ?? "Failed to create");
      return;
    }
    toast.success("Customer created. Share the credentials with them.");
    setOpen(false);
    reset();
    load();
  };

  const copyCredentials = () => {
    const text = `Login: ${window.location.origin}/login\nEmail: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard");
  };

  const openAssign = (p: Profile) => {
    setAssignFor(p);
    const set = new Set(links.filter(l => l.user_id === p.user_id).map(l => l.event_id));
    setAssignSet(set);
  };

  const saveAssign = async () => {
    if (!assignFor) return;
    const current = new Set(links.filter(l => l.user_id === assignFor.user_id).map(l => l.event_id));
    const toAdd = [...assignSet].filter(id => !current.has(id));
    const toRemove = [...current].filter(id => !assignSet.has(id));

    if (toAdd.length > 0) {
      const { error } = await supabase.from("event_customers")
        .insert(toAdd.map(event_id => ({ event_id, user_id: assignFor.user_id })));
      if (error) return toast.error(error.message);
    }
    if (toRemove.length > 0) {
      const { error } = await supabase.from("event_customers")
        .delete().eq("user_id", assignFor.user_id).in("event_id", toRemove);
      if (error) return toast.error(error.message);
    }

    // Ensure 'customer' role
    const hasCustomerRole = roles.some(r => r.user_id === assignFor.user_id && r.role === "customer");
    if (!hasCustomerRole && assignSet.size > 0) {
      await supabase.from("user_roles").insert({ user_id: assignFor.user_id, role: "customer" as any });
    }

    toast.success("Event assignments updated");
    setAssignFor(null);
    load();
  };

  const removeUser = async (p: Profile) => {
    if (!confirm(`Remove all event access and customer role for ${p.email}? (Their auth account remains.)`)) return;
    await supabase.from("event_customers").delete().eq("user_id", p.user_id);
    await supabase.from("user_roles").delete().eq("user_id", p.user_id).eq("role", "customer" as any);
    toast.success("Customer access removed");
    load();
  };

  const rolesFor = (uid: string) => roles.filter(r => r.user_id === uid).map(r => r.role);
  const eventsFor = (uid: string) => links.filter(l => l.user_id === uid).length;

  const openEdit = (p: Profile) => {
    setEditFor(p);
    setEditName(p.display_name ?? "");
    setEditEmail(p.email ?? "");
    setEditPassword("");
    const r = rolesFor(p.user_id);
    setEditRole(
      r.includes("superadmin") ? "superadmin" : r.includes("admin") ? "admin" : "customer"
    );
  };

  const saveEdit = async () => {
    if (!editFor) return;
    setSavingEdit(true);
    const { data, error } = await supabase.functions.invoke("admin-update-customer", {
      body: {
        user_id: editFor.user_id,
        display_name: editName.trim() || null,
        email: editEmail.trim() !== (editFor.email ?? "") ? editEmail.trim() : undefined,
        password: editPassword.length > 0 ? editPassword : undefined,
        role: editRole,
      },
    });
    setSavingEdit(false);
    if (error || (data && (data as any).error)) {
      toast.error((data as any)?.error ?? error?.message ?? "Failed to update");
      return;
    }
    toast.success("Customer updated");
    setEditFor(null);
    load();
  };

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = profiles.filter(p => {
      const userRoles = rolesFor(p.user_id);
      if (roleFilter === "admin" && !(userRoles.includes("admin") || userRoles.includes("superadmin"))) return false;
      if (roleFilter === "superadmin" && !userRoles.includes("superadmin")) return false;
      if (roleFilter === "customer" && !userRoles.includes("customer")) return false;
      if (roleFilter === "none" && userRoles.length > 0) return false;
      if (!q) return true;
      return [p.display_name ?? "", p.email ?? ""].join(" ").toLowerCase().includes(q);
    });
    const cmp: Record<string, (a: Profile, b: Profile) => number> = {
      created_desc: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      created_asc: (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      name_asc: (a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""),
      name_desc: (a, b) => (b.display_name ?? "").localeCompare(a.display_name ?? ""),
      email_asc: (a, b) => (a.email ?? "").localeCompare(b.email ?? ""),
      email_desc: (a, b) => (b.email ?? "").localeCompare(a.email ?? ""),
      events_desc: (a, b) => eventsFor(b.user_id) - eventsFor(a.user_id),
      events_asc: (a, b) => eventsFor(a.user_id) - eventsFor(b.user_id),
    };
    return [...arr].sort(cmp[sortBy] ?? cmp.created_desc);
  }, [profiles, roles, links, search, roleFilter, sortBy]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">
              {roleFilter === "admin" || roleFilter === "superadmin" ? "Admin users" : "Customers"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {roleFilter === "admin" || roleFilter === "superadmin"
                ? "Manage administrators and superadmins for the platform."
                : "Create accounts for your customers and assign them to events."}
            </p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                <UserPlus className="h-4 w-4 mr-2" /> New customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Create customer account</DialogTitle>
              </DialogHeader>
              <form onSubmit={createCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Sok Family" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
                    <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this password with the customer — they'll use it to log in.</p>
                </div>
                {events.length > 0 && (
                  <div className="space-y-2">
                    <Label>Assign to events (optional)</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-border rounded-md p-3 bg-secondary/30">
                      {events.map(ev => (
                        <label key={ev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={selectedEvents.includes(ev.id)}
                            onCheckedChange={(c) => {
                              setSelectedEvents(prev => c ? [...prev, ev.id] : prev.filter(i => i !== ev.id));
                            }}
                          />
                          <span>{ev.title} <span className="text-muted-foreground text-xs">/{ev.slug}</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-2">
                  {email && password && (
                    <Button type="button" variant="outline" onClick={copyCredentials}>
                      <Link2 className="h-4 w-4 mr-2" /> Copy credentials
                    </Button>
                  )}
                  <Button type="submit" disabled={creating} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                    {creating ? "Creating…" : "Create customer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name or email…"
          filter={{
            value: roleFilter, onChange: updateRoleFilter,
            label: "Role",
            options: [
              { value: "all", label: "All roles" },
              { value: "superadmin", label: "Superadmins" },
              { value: "admin", label: "Admins" },
              { value: "customer", label: "Customers" },
              { value: "none", label: "No role" },
            ],
          }}
          sort={{
            value: sortBy, onChange: setSortBy,
            options: [
              { value: "created_desc", label: "Newest first" },
              { value: "created_asc", label: "Oldest first" },
              { value: "name_asc", label: "Name A→Z" },
              { value: "name_desc", label: "Name Z→A" },
              { value: "email_asc", label: "Email A→Z" },
              { value: "email_desc", label: "Email Z→A" },
              { value: "events_desc", label: "Most events" },
              { value: "events_asc", label: "Fewest events" },
            ],
          }}
          resultCount={filteredProfiles.length}
          totalCount={profiles.length}
          resultLabel="customers"
        />

        <section className="rounded-xl border border-border bg-card shadow-soft">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="h-10 w-10 text-gold mx-auto mb-3 opacity-60" />
              <p className="text-sm text-muted-foreground">No accounts yet. Create your first customer.</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No customers match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Roles</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Events</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProfiles.map(p => {
                    const userRoles = rolesFor(p.user_id);
                    const isAdminRow = userRoles.includes("admin") || userRoles.includes("superadmin");
                    return (
                      <tr key={p.user_id} className="hover:bg-secondary/30">
                        <td className="p-4 font-medium">{p.display_name ?? "—"}</td>
                        <td className="p-4 text-muted-foreground">{p.email}</td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {userRoles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                            {userRoles.map(r => (
                              <span key={r} className={`text-xs px-2 py-0.5 rounded-full border ${
                                r === "superadmin"
                                  ? "border-gold text-gold bg-gold/10 font-medium"
                                  : r === "admin"
                                    ? "border-gold/40 text-gold bg-gold/5"
                                    : "border-border text-muted-foreground"
                              }`}>{r}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">{eventsFor(p.user_id)}</td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-1 flex-wrap justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openAssign(p)} disabled={isAdminRow}>
                              Events
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeUser(p)} disabled={isAdminRow || p.user_id === currentUser?.id} title="Remove customer access">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Assign dialog */}
      <Dialog open={!!assignFor} onOpenChange={(v) => { if (!v) setAssignFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Assign events</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">For <span className="text-gold">{assignFor?.email}</span></p>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events to assign yet.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 border border-border rounded-md p-3 bg-secondary/30">
                {events.map(ev => (
                  <label key={ev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={assignSet.has(ev.id)}
                      onCheckedChange={(c) => {
                        const next = new Set(assignSet);
                        if (c) next.add(ev.id); else next.delete(ev.id);
                        setAssignSet(next);
                      }}
                    />
                    <span>{ev.title} <span className="text-muted-foreground text-xs">/{ev.slug}</span></span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveAssign} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              Save assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFor} onOpenChange={(v) => { if (!v) setEditFor(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={editName} maxLength={100} onChange={e => setEditName(e.target.value)} placeholder="Sok Family" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} maxLength={255} onChange={e => setEditEmail(e.target.value)} placeholder="customer@example.com" />
            </div>
            <div className="space-y-2">
              <Label>New password <span className="text-xs text-muted-foreground">(leave blank to keep current)</span></Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => {
                  setEditPassword(securePassword(12));
                }} title="Generate">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as "admin" | "superadmin" | "customer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {/* Only superadmins can grant the superadmin role. Show the
                      option in read-only form when viewing an existing superadmin
                      so the current value is still visible to regular admins. */}
                  {(isSuperadmin || editRole === "superadmin") && (
                    <SelectItem value="superadmin" disabled={!isSuperadmin}>
                      Superadmin
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isSuperadmin && editRole === "superadmin" && (
                <p className="text-xs text-muted-foreground">Only a superadmin can change this user's role.</p>
              )}
              {editFor?.user_id === currentUser?.id && (
                <p className="text-xs text-warning">You can't downgrade your own admin role.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFor(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
