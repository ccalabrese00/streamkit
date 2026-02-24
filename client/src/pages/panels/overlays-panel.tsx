import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import type { Overlay } from "@shared/schema";

export default function OverlaysPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overlays"] });
      setShowForm(false);
      setName("");
      setBgColor("#0a0a1a");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Overlay> }) => {
      const res = await apiRequest("PUT", `/api/overlays/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overlays"] });
      setEditingId(null);
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
          <Layers className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No overlays yet</p>
          <p className="text-xs text-white/30 mt-1">Create your first overlay to get started</p>
        </div>
      ) : (
        <div className="grid gap-3" data-testid="list-overlays">
          {overlays.map((overlay) => (
            <OverlayCard
              key={overlay.id}
              overlay={overlay}
              isEditing={editingId === overlay.id}
              onEdit={() => setEditingId(overlay.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(data) => updateMutation.mutate({ id: overlay.id, data })}
              onDelete={() => deleteMutation.mutate(overlay.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Layers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22.54 12.43-1.96-.89L12 15.45l-8.58-3.91-1.96.89a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 .26-1.84Z"/>
      <path d="m22.54 16.43-1.96-.89L12 19.45l-8.58-3.91-1.96.89a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 .26-1.84Z"/>
    </svg>
  );
}

function OverlayCard({
  overlay,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  overlay: Overlay;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<Overlay>) => void;
  onDelete: () => void;
}) {
  const [editName, setEditName] = useState(overlay.name);

  return (
    <div
      className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.07] transition"
      data-testid={`card-overlay-${overlay.id}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="h-8 w-8 rounded-lg shrink-0 border border-white/10"
          style={{ backgroundColor: overlay.bgColor }}
        />
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-white/5 border-white/10 text-white h-8 text-sm"
            autoFocus
            data-testid={`input-rename-overlay-${overlay.id}`}
          />
        ) : (
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/90 truncate">{overlay.name}</div>
            <div className="text-[11px] text-white/40 font-mono">{overlay.bgColor}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-3">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-emerald-400"
              onClick={() => onUpdate({ name: editName })}
              data-testid={`button-save-overlay-${overlay.id}`}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/40"
              onClick={onCancelEdit}
              data-testid={`button-cancel-rename-${overlay.id}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/40 opacity-0 group-hover:opacity-100"
              onClick={onEdit}
              data-testid={`button-edit-overlay-${overlay.id}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 opacity-0 group-hover:opacity-100"
              onClick={onDelete}
              data-testid={`button-delete-overlay-${overlay.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
