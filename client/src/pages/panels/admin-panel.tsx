import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Shield,
  Ban,
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Users,
  ShieldAlert,
} from "lucide-react";

type AdminTab = "users" | "security";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  email: string | null;
  ip: string | null;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <div>
      <p className="text-sm text-white/50 mb-4">Manage users and monitor security</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            tab === "users" ? "bg-purple-600/20 text-purple-300" : "text-white/50 hover:bg-white/5 hover:text-white/80"
          )}
          data-testid="admin-tab-users"
        >
          <Users className="h-4 w-4" />
          Users
        </button>
        <button
          onClick={() => setTab("security")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            tab === "security" ? "bg-purple-600/20 text-purple-300" : "text-white/50 hover:bg-white/5 hover:text-white/80"
          )}
          data-testid="admin-tab-security"
        >
          <ShieldAlert className="h-4 w-4" />
          Security Alerts
        </button>
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [banTargetId, setBanTargetId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "security-events"] });
      setBanTargetId(null);
      setBanReason("");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}/unban`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "security-events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "security-events"] });
      setDeleteConfirmId(null);
    },
  });

  if (isLoading) {
    return <div className="text-white/40 text-sm">Loading users...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-white/40 mb-2">{users.length} registered user{users.length !== 1 ? "s" : ""}</div>

      {users.map((u) => (
        <div
          key={u.id}
          className={cn(
            "rounded-xl border p-4",
            u.banned
              ? "border-red-500/20 bg-red-500/5"
              : "border-white/10 bg-white/5"
          )}
          data-testid={`admin-user-${u.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white/90">{u.username}</span>
                {u.role === "admin" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-300 font-medium">
                    ADMIN
                  </span>
                )}
                {u.banned && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                    BANNED
                  </span>
                )}
              </div>
              <div className="text-xs text-white/40">{u.email}</div>
              <div className="text-[10px] text-white/30 mt-1">
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </div>
              {u.banned && u.banReason && (
                <div className="text-xs text-red-400/70 mt-2">
                  Reason: {u.banReason}
                </div>
              )}
            </div>

            {u.role !== "admin" && (
              <div className="flex items-center gap-2 shrink-0">
                {u.banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10"
                    onClick={() => unbanMutation.mutate(u.id)}
                    disabled={unbanMutation.isPending}
                    data-testid={`button-unban-${u.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={() => {
                      setBanTargetId(u.id);
                      setBanReason("");
                    }}
                    data-testid={`button-ban-${u.id}`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Ban
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                  onClick={() => setDeleteConfirmId(u.id)}
                  data-testid={`button-delete-user-${u.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {banTargetId === u.id && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-white/50 mb-2">Why are you banning this user?</div>
              <div className="flex gap-2">
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Spam, abuse, TOS violation..."
                  className="bg-white/5 border-white/10 text-white h-8 text-xs flex-1"
                  data-testid={`input-ban-reason-${u.id}`}
                />
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                  onClick={() => banMutation.mutate({ id: u.id, reason: banReason })}
                  disabled={!banReason.trim() || banMutation.isPending}
                  data-testid={`button-confirm-ban-${u.id}`}
                >
                  Confirm Ban
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/50 text-xs h-8"
                  onClick={() => setBanTargetId(null)}
                  data-testid={`button-cancel-ban-${u.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {deleteConfirmId === u.id && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-red-400 mb-2">
                This will permanently delete this user and all their data. This cannot be undone.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                  onClick={() => deleteMutation.mutate(u.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-confirm-delete-${u.id}`}
                >
                  Yes, Delete User
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/50 text-xs h-8"
                  onClick={() => setDeleteConfirmId(null)}
                  data-testid={`button-cancel-delete-${u.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["admin", "security-events"],
    queryFn: async () => {
      const res = await fetch("/api/admin/security-events", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/security-events/${id}/resolve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "security-events"] });
    },
  });

  const unresolvedCount = events.filter((e) => !e.resolved).length;
  const highSeverity = events.filter((e) => e.severity === "high" && !e.resolved);

  if (isLoading) {
    return <div className="text-white/40 text-sm">Loading security events...</div>;
  }

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertOctagon className="h-4 w-4 text-red-400" />;
      case "medium": return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "high": return "border-red-500/20 bg-red-500/5";
      case "medium": return "border-yellow-500/20 bg-yellow-500/5";
      default: return "border-blue-500/20 bg-blue-500/5";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "failed_login": return "Failed Login";
      case "brute_force": return "Brute Force";
      case "password_spray": return "Password Spray";
      case "user_banned": return "User Banned";
      case "user_unbanned": return "User Unbanned";
      case "user_deleted": return "User Deleted";
      default: return type;
    }
  };

  return (
    <div>
      {highSeverity.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4" data-testid="alert-high-severity">
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              {highSeverity.length} high severity alert{highSeverity.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-red-400/70">
            Potential brute force or password spray attacks detected. Review below.
          </p>
        </div>
      )}

      <div className="text-xs text-white/40 mb-3">
        {events.length} event{events.length !== 1 ? "s" : ""} total, {unresolvedCount} unresolved
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <div className="text-sm text-white/60">No security events recorded yet</div>
          <div className="text-xs text-white/30 mt-1">Events will appear here when suspicious activity is detected</div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={cn(
                "rounded-lg border p-3",
                event.resolved ? "border-white/5 bg-white/[0.02] opacity-50" : severityColor(event.severity)
              )}
              data-testid={`security-event-${event.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {severityIcon(event.severity)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white/80">{typeLabel(event.type)}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        event.severity === "high" ? "bg-red-500/20 text-red-400" :
                        event.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}>
                        {event.severity.toUpperCase()}
                      </span>
                      {event.resolved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">{event.message}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/30">
                      {event.email && <span>{event.email}</span>}
                      {event.ip && <span>IP: {event.ip}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {!event.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10 shrink-0"
                    onClick={() => resolveMutation.mutate(event.id)}
                    disabled={resolveMutation.isPending}
                    data-testid={`button-resolve-${event.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
