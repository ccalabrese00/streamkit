import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Monitor,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import OverlaysPanel from "./panels/overlays-panel";
import ScenesPanel from "./panels/scenes-panel";
import AlertsPanel from "./panels/alerts-panel";
import SettingsPanel from "./panels/settings-panel";
import AdminPanel from "./panels/admin-panel";

type Tab = "overlays" | "scenes" | "alerts" | "settings" | "admin";

const baseTabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: "overlays", label: "Overlays", icon: <Layers className="h-4 w-4" /> },
  { id: "scenes", label: "Scenes", icon: <Monitor className="h-4 w-4" /> },
  { id: "alerts", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  { id: "admin", label: "Admin", icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overlays");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = baseTabs.filter((t) => !t.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-56 border-r border-white/10 bg-[#0d0d20] flex flex-col transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
          <Monitor className="h-5 w-5 text-purple-400" />
          <span className="text-base font-semibold text-white tracking-tight">StreamKit</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                activeTab === t.id
                  ? "bg-purple-600/20 text-purple-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              )}
              data-testid={`nav-${t.id}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-semibold text-purple-300">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white/80 truncate">{user?.username}</div>
              <div className="text-[10px] text-white/40 truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-white/50 hover:text-white/80"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-lg px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-white/60"
              data-testid="button-menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-white capitalize" data-testid="text-page-title">
              {activeTab}
            </h1>
          </div>
        </header>

        <div className={activeTab === "overlays" ? "" : "p-4 md:p-6 max-w-5xl"}>
          {activeTab === "overlays" && <OverlaysPanel />}
          {activeTab === "scenes" && <ScenesPanel />}
          {activeTab === "alerts" && <AlertsPanel />}
          {activeTab === "settings" && <SettingsPanel />}
          {activeTab === "admin" && <AdminPanel />}
        </div>
      </main>
    </div>
  );
}
