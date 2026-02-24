import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, X, Check, Loader2, Monitor } from "lucide-react";
import type { Scene } from "@shared/schema";

const sceneTypes = [
  { value: "starting", label: "Starting Soon" },
  { value: "brb", label: "Be Right Back" },
  { value: "ending", label: "Stream Ending" },
  { value: "intermission", label: "Intermission" },
  { value: "custom", label: "Custom" },
];

export default function ScenesPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("custom");

  const { data: scenes = [], isLoading } = useQuery<Scene[]>({
    queryKey: ["/api/scenes"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scenes", {
        name: name || "Untitled Scene",
        type,
        config: {},
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setShowForm(false);
      setName("");
      setType("custom");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Scene> }) => {
      const res = await apiRequest("PUT", `/api/scenes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/scenes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
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
        <p className="text-sm text-white/50">Create and manage your stream scenes</p>
        <Button
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-scene"
        >
          <Plus className="h-4 w-4" />
          New Scene
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 mb-6">
          <div className="text-sm font-medium text-purple-300 mb-3">Create Scene</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Scene"
                className="bg-white/5 border-white/10 text-white h-9"
                data-testid="input-scene-name"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-white/60 text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9" data-testid="select-scene-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sceneTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="button-create-scene"
            >
              {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-white/60"
              data-testid="button-cancel-scene"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center" data-testid="text-scenes-empty">
          <Monitor className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No scenes yet</p>
          <p className="text-xs text-white/30 mt-1">Create your first scene to get started</p>
        </div>
      ) : (
        <div className="grid gap-3" data-testid="list-scenes">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isEditing={editingId === scene.id}
              onEdit={() => setEditingId(scene.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(data) => updateMutation.mutate({ id: scene.id, data })}
              onDelete={() => deleteMutation.mutate(scene.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SceneCard({
  scene,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  scene: Scene;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<Scene>) => void;
  onDelete: () => void;
}) {
  const [editName, setEditName] = useState(scene.name);
  const typeLabel = sceneTypes.find((t) => t.value === scene.type)?.label || scene.type;

  return (
    <div
      className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.07] transition"
      data-testid={`card-scene-${scene.id}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-lg shrink-0 border border-white/10 bg-purple-600/20 flex items-center justify-center">
          <Monitor className="h-4 w-4 text-purple-400" />
        </div>
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-white/5 border-white/10 text-white h-8 text-sm"
            autoFocus
            data-testid={`input-rename-scene-${scene.id}`}
          />
        ) : (
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/90 truncate">{scene.name}</div>
            <div className="text-[11px] text-white/40">{typeLabel}</div>
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
              data-testid={`button-save-scene-${scene.id}`}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/40"
              onClick={onCancelEdit}
              data-testid={`button-cancel-rename-scene-${scene.id}`}
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
              data-testid={`button-edit-scene-${scene.id}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 opacity-0 group-hover:opacity-100"
              onClick={onDelete}
              data-testid={`button-delete-scene-${scene.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
