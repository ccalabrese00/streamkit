import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, X, Check, Loader2, Bell, UserPlus, DollarSign, Star } from "lucide-react";
import type { Alert } from "@shared/schema";

const alertTypes = [
  { value: "follower", label: "Follower", icon: UserPlus, color: "text-blue-400" },
  { value: "donation", label: "Donation", icon: DollarSign, color: "text-green-400" },
  { value: "subscriber", label: "Subscriber", icon: Star, color: "text-amber-400" },
];

const animations = [
  { value: "fadeIn", label: "Fade In" },
  { value: "slideUp", label: "Slide Up" },
  { value: "slideDown", label: "Slide Down" },
  { value: "bounce", label: "Bounce" },
  { value: "zoom", label: "Zoom" },
];

export default function AlertsPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState("follower");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertDuration, setAlertDuration] = useState(5);
  const [alertColor, setAlertColor] = useState("#8b5cf6");
  const [alertAnimation, setAlertAnimation] = useState("fadeIn");

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/alerts", {
        name: alertName || "Untitled Alert",
        type: alertType,
        message: alertMessage,
        duration: alertDuration,
        color: alertColor,
        animation: alertAnimation,
        enabled: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Alert> }) => {
      const res = await apiRequest("PUT", `/api/alerts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  function resetForm() {
    setAlertName("");
    setAlertType("follower");
    setAlertMessage("");
    setAlertDuration(5);
    setAlertColor("#8b5cf6");
    setAlertAnimation("fadeIn");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/50">Set up follower, donation, and subscriber alerts</p>
        <Button
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-alert"
        >
          <Plus className="h-4 w-4" />
          New Alert
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 mb-6">
          <div className="text-sm font-medium text-purple-300 mb-3">Create Alert</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Name</Label>
              <Input
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="New Follower Alert"
                className="bg-white/5 border-white/10 text-white h-9"
                data-testid="input-alert-name"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Type</Label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9" data-testid="select-alert-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label className="text-white/60 text-xs">Message</Label>
              <Input
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Thanks for the follow, {name}!"
                className="bg-white/5 border-white/10 text-white h-9"
                data-testid="input-alert-message"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Duration (seconds)</Label>
              <Input
                type="number"
                value={alertDuration}
                onChange={(e) => setAlertDuration(parseInt(e.target.value) || 5)}
                min={1}
                max={30}
                className="bg-white/5 border-white/10 text-white h-9"
                data-testid="input-alert-duration"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Animation</Label>
              <Select value={alertAnimation} onValueChange={setAlertAnimation}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9" data-testid="select-alert-animation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {animations.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={alertColor}
                  onChange={(e) => setAlertColor(e.target.value)}
                  className="h-9 w-12 rounded border border-white/10 bg-transparent cursor-pointer"
                  data-testid="input-alert-color"
                />
                <Input
                  value={alertColor}
                  onChange={(e) => setAlertColor(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9 font-mono text-xs flex-1"
                  data-testid="input-alert-color-hex"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="button-create-alert"
            >
              {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-white/60"
              data-testid="button-cancel-alert"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center" data-testid="text-alerts-empty">
          <Bell className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No alerts yet</p>
          <p className="text-xs text-white/30 mt-1">Create alerts for followers, donations, and subscribers</p>
        </div>
      ) : (
        <div className="grid gap-3" data-testid="list-alerts">
          {alerts.map((alert) => {
            const typeInfo = alertTypes.find((t) => t.value === alert.type);
            const Icon = typeInfo?.icon || Bell;

            return (
              <div
                key={alert.id}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.07] transition"
                data-testid={`card-alert-${alert.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="h-8 w-8 rounded-lg shrink-0 border border-white/10 flex items-center justify-center"
                    style={{ backgroundColor: alert.color + "20" }}
                  >
                    <Icon className={`h-4 w-4 ${typeInfo?.color || "text-white/60"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">{alert.name}</div>
                    <div className="text-[11px] text-white/40">
                      {typeInfo?.label || alert.type} · {alert.duration}s · {alert.animation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(enabled) =>
                      updateMutation.mutate({ id: alert.id, data: { enabled } })
                    }
                    data-testid={`switch-alert-${alert.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteMutation.mutate(alert.id)}
                    data-testid={`button-delete-alert-${alert.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
