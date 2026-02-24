import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User } from "lucide-react";

export default function SettingsPanel() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-lg">
      <p className="text-sm text-white/50 mb-6">Manage your account settings</p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-purple-600/30 flex items-center justify-center">
            <User className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <div className="text-base font-medium text-white/90" data-testid="text-settings-username">
              {user?.username}
            </div>
            <div className="text-sm text-white/50" data-testid="text-settings-email">
              {user?.email}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-white/60 text-xs">Username</Label>
            <Input
              value={user?.username || ""}
              disabled
              className="bg-white/5 border-white/10 text-white/60 h-9"
              data-testid="input-settings-username"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-white/60 text-xs">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-white/5 border-white/10 text-white/60 h-9"
              data-testid="input-settings-email"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="text-sm font-medium text-red-300 mb-2">Danger Zone</div>
        <p className="text-xs text-white/50 mb-4">
          Logging out will end your current session.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => logout()}
          data-testid="button-settings-logout"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
