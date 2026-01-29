export type ElementType = "text" | "socials" | "nowPlaying" | "clock" | "logo" | "chatPreview";

export interface OverlayElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  color: string;
  bgColor: string;
  bgOpacity: number;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
}

export interface CustomOverlay {
  id: string;
  name: string;
  elements: OverlayElement[];
  bgColor: string;
  createdAt: number;
  updatedAt: number;
}

export const defaultElements: Record<ElementType, Partial<OverlayElement>> = {
  text: {
    width: 300,
    height: 60,
    content: "Your Text Here",
    fontSize: 32,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  socials: {
    width: 280,
    height: 100,
    content: "@yourusername",
    fontSize: 18,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.6,
    fontWeight: "normal",
    textAlign: "left",
  },
  nowPlaying: {
    width: 320,
    height: 70,
    content: "Lo-fi Beats • Chill Stream",
    fontSize: 16,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.6,
    fontWeight: "normal",
    textAlign: "left",
  },
  clock: {
    width: 120,
    height: 50,
    content: "",
    fontSize: 24,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  logo: {
    width: 80,
    height: 80,
    content: "",
    fontSize: 12,
    color: "#ffffff",
    bgColor: "#6366f1",
    bgOpacity: 1,
    fontWeight: "normal",
    textAlign: "center",
  },
  chatPreview: {
    width: 300,
    height: 200,
    content: "",
    fontSize: 14,
    color: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.7,
    fontWeight: "normal",
    textAlign: "left",
  },
};

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createElement(type: ElementType, x = 50, y = 50): OverlayElement {
  const defaults = defaultElements[type];
  return {
    id: createId(),
    type,
    x,
    y,
    width: defaults.width || 200,
    height: defaults.height || 60,
    content: defaults.content || "",
    fontSize: defaults.fontSize || 16,
    color: defaults.color || "#ffffff",
    bgColor: defaults.bgColor || "#000000",
    bgOpacity: defaults.bgOpacity ?? 0.5,
    fontWeight: defaults.fontWeight || "normal",
    textAlign: defaults.textAlign || "left",
  };
}

export function createOverlay(name = "Untitled Overlay"): CustomOverlay {
  return {
    id: createId(),
    name,
    elements: [],
    bgColor: "#0a0a0f",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY = "twitch_custom_overlays";

export function loadOverlays(): CustomOverlay[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOverlays(overlays: CustomOverlay[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overlays));
}

export function encodeOverlayToQuery(overlay: CustomOverlay): string {
  const data = JSON.stringify(overlay);
  return btoa(encodeURIComponent(data));
}

export function decodeOverlayFromQuery(encoded: string): CustomOverlay | null {
  try {
    const data = decodeURIComponent(atob(encoded));
    return JSON.parse(data);
  } catch {
    return null;
  }
}
