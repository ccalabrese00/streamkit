import { type SceneConfig } from "@/lib/twitchSceneConfig";

export type ScenePreset = {
  id: string;
  name: string;
  config: SceneConfig;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "twitchSceneMaker.presets.v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPresets(): ScenePreset[] {
  const parsed = safeJsonParse<ScenePreset[]>(localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];

  return parsed
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      id: String((p as any).id ?? ""),
      name: String((p as any).name ?? "Untitled"),
      config: (p as any).config as SceneConfig,
      createdAt: Number((p as any).createdAt ?? Date.now()),
      updatedAt: Number((p as any).updatedAt ?? Date.now()),
    }))
    .filter((p) => p.id.length > 0 && p.name.length > 0);
}

export function savePresets(presets: ScenePreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function makeId() {
  return Math.random().toString(36).slice(2, 9) + "_" + Date.now().toString(36);
}
