import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Loader2, Paintbrush } from "lucide-react";
import type { Overlay } from "@shared/schema";
import OverlayEditor from "./overlay-editor";

export default function OverlaysPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null);
  const [name, setName] = useState("");
  const [bgColor, setBgColor] = useState("#0a0a1a");

  const { data: overlays = [], isLoading } = useQuery<Overlay[]>({
    queryKey: ["/api/overlays"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/overlays", {
        name: name || "Untitled Overlay",
        bgColor,
        elements: [],
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/overlays"] });
      setShowForm(false);
      setName("");
      setBgColor("#0a0a1a");
      setEditingOverlay(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/overlays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overlays"] });
    },
  });

  if (editingOverlay) {
    const freshOverlay = overlays.find((o) => o.id === editingOverlay.id) || editingOverlay;
    return (
      <OverlayEditor
        overlay={freshOverlay}
        onBack={() => setEditingOverlay(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/50">Create and manage your stream overlays</p>
        <Button
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-overlay"
        >
          <Plus className="h-4 w-4" />
          New Overlay
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 mb-6">
          <div className="text-sm font-medium text-purple-300 mb-3">Create Overlay</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Overlay"
                className="bg-white/5 border-white/10 text-white h-9"
                data-testid="input-overlay-name"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Background Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-12 rounded border border-white/10 bg-transparent cursor-pointer"
                  data-testid="input-overlay-color"
                />
                <Input
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-9 font-mono text-xs flex-1"
                  data-testid="input-overlay-color-hex"
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
              data-testid="button-create-overlay"
            >
              {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-white/60"
              data-testid="button-cancel-overlay"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {overlays.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center" data-testid="text-overlays-empty">
          <LayersIcon className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No overlays yet</p>
          <p className="text-xs text-white/30 mt-1">Create your first overlay to get started</p>
        </div>
      ) : (
        <div className="grid gap-3" data-testid="list-overlays">
          {overlays.map((overlay) => (
            <div
              key={overlay.id}
              className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.07] transition"
              data-testid={`card-overlay-${overlay.id}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="h-10 w-16 rounded-lg shrink-0 border border-white/10 relative overflow-hidden"
                  style={{ backgroundColor: overlay.bgColor }}
                >
                  {Array.isArray(overlay.elements) && (overlay.elements as any[]).length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-[6px] text-white/40">
                        {(overlay.elements as any[]).length} element{(overlay.elements as any[]).length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate">{overlay.name}</div>
                  <div className="text-[11px] text-white/40">
                    {Array.isArray(overlay.elements) ? (overlay.elements as any[]).length : 0} elements
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  onClick={() => setEditingOverlay(overlay)}
                  data-testid={`button-edit-overlay-${overlay.id}`}
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-400 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteMutation.mutate(overlay.id)}
                  data-testid={`button-delete-overlay-${overlay.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22.54 12.43-1.96-.89L12 15.45l-8.58-3.91-1.96.89a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 .26-1.84Z"/>
      <path d="m22.54 16.43-1.96-.89L12 19.45l-8.58-3.91-1.96.89a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 .26-1.84Z"/>
    </svg>
  );
}
