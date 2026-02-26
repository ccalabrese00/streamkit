import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  ArrowLeft,
  Type,
  Square,
  Circle,
  Image,
  Trash2,
  Save,
  Loader2,
  Copy,
  MoveUp,
  MoveDown,
  Minus,
  Plus,
  Smile,
  PenTool,
  Sparkles,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@shared/schema";
import type { OverlayElement } from "./overlay-editor";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

interface GiphySticker {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  originalUrl: string;
  width: number;
  height: number;
}

const animations = [
  { value: "fadeIn", label: "Fade In" },
  { value: "slideUp", label: "Slide Up" },
  { value: "slideDown", label: "Slide Down" },
  { value: "bounce", label: "Bounce" },
  { value: "zoom", label: "Zoom" },
];

const alertTypes = [
  { value: "follower", label: "Follower" },
  { value: "donation", label: "Donation" },
  { value: "subscriber", label: "Subscriber" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function defaultElement(type: OverlayElement["type"]): OverlayElement {
  const base = { id: generateId(), x: 50, y: 50, opacity: 1, rotation: 0 };
  switch (type) {
    case "text":
      return { ...base, type: "text", width: 300, height: 50, text: "Your Text", fontSize: 36, fontFamily: "Outfit", color: "#ffffff", fill: "transparent", stroke: "transparent", strokeWidth: 0, borderRadius: 0 };
    case "rect":
      return { ...base, type: "rect", width: 200, height: 120, fill: "#8b5cf6", stroke: "transparent", strokeWidth: 0, borderRadius: 0 };
    case "circle":
      return { ...base, type: "circle", width: 120, height: 120, fill: "#8b5cf6", stroke: "transparent", strokeWidth: 0, borderRadius: 9999 };
    case "image":
      return { ...base, type: "image", width: 200, height: 120, src: "", borderRadius: 0 };
    case "sticker":
      return { ...base, type: "sticker", width: 120, height: 120, sticker: "", src: "" };
    case "drawing":
      return { ...base, type: "drawing", width: 200, height: 200, drawingPath: "", drawingColor: "#ffffff", drawingWidth: 4 };
  }
}

export default function AlertEditor({
  alert,
  onBack,
}: {
  alert: Alert;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<OverlayElement[]>(
    (alert.elements as OverlayElement[]) || []
  );
  const [bgColor, setBgColor] = useState(alert.bgColor || "transparent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    elementId: string;
    handle: string;
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const [alertMessage, setAlertMessage] = useState(alert.message);
  const [alertDuration, setAlertDuration] = useState(alert.duration);
  const [alertAnimation, setAlertAnimation] = useState(alert.animation);
  const [alertType, setAlertType] = useState(alert.type);
  const [alertColor, setAlertColor] = useState(alert.color);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [giphyStickers, setGiphyStickers] = useState<GiphySticker[]>([]);
  const [giphySearch, setGiphySearch] = useState("");
  const [giphyLoading, setGiphyLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#ffffff");
  const [drawingWidth, setDrawingWidth] = useState(4);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setElements((alert.elements as OverlayElement[]) || []);
    setBgColor(alert.bgColor || "transparent");
    setAlertMessage(alert.message);
    setAlertDuration(alert.duration);
    setAlertAnimation(alert.animation);
    setAlertType(alert.type);
    setAlertColor(alert.color);
    setSelectedId(null);
    setHasUnsaved(false);
  }, [alert.id]);

  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const selected = elements.find((e) => e.id === selectedId) || null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/alerts/${alert.id}`, {
        elements,
        bgColor,
        message: alertMessage,
        duration: alertDuration,
        animation: alertAnimation,
        type: alertType,
        color: alertColor,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setHasUnsaved(false);
    },
  });

  function updateElement(id: string, updates: Partial<OverlayElement>) {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
    setHasUnsaved(true);
  }

  function addElement(type: OverlayElement["type"]) {
    const el = defaultElement(type);
    el.x = CANVAS_WIDTH / 2 - el.width / 2;
    el.y = CANVAS_HEIGHT / 2 - el.height / 2;
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    setHasUnsaved(true);
  }

  async function fetchGiphyTrending() {
    setGiphyLoading(true);
    try {
      const res = await fetch("/api/giphy/trending?limit=25", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGiphyStickers(data.stickers);
    } catch (err) {
      console.error("Giphy trending error:", err);
    } finally {
      setGiphyLoading(false);
    }
  }

  async function searchGiphy(q: string) {
    if (!q.trim()) { fetchGiphyTrending(); return; }
    setGiphyLoading(true);
    try {
      const res = await fetch(`/api/giphy/search?q=${encodeURIComponent(q)}&limit=25`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGiphyStickers(data.stickers);
    } catch (err) {
      console.error("Giphy search error:", err);
    } finally {
      setGiphyLoading(false);
    }
  }

  function handleGiphySearchChange(value: string) {
    setGiphySearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchGiphy(value), 400);
  }

  function addGiphySticker(sticker: GiphySticker) {
    const el = defaultElement("sticker");
    el.src = sticker.originalUrl;
    el.sticker = sticker.title;
    const aspect = sticker.width / sticker.height;
    el.width = 120;
    el.height = Math.round(120 / aspect);
    el.x = CANVAS_WIDTH / 2 - el.width / 2;
    el.y = CANVAS_HEIGHT / 2 - el.height / 2;
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    setShowStickerPicker(false);
    setHasUnsaved(true);
  }

  async function generateAiImage() {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      const el = defaultElement("image");
      el.src = data.dataUrl;
      el.width = 200;
      el.height = 200;
      el.x = CANVAS_WIDTH / 2 - el.width / 2;
      el.y = CANVAS_HEIGHT / 2 - el.height / 2;
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      setShowAiGenerator(false);
      setAiPrompt("");
      setHasUnsaved(true);
    } catch (err) {
      console.error("AI generation failed:", err);
      setAiError("Failed to generate image. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  }

  function pointsToSvgPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }

  function handleDrawingStart(e: React.MouseEvent) {
    if (!drawingMode || !canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setIsDrawing(true);
    setCurrentDrawingPoints([{ x, y }]);
  }

  function handleDrawingMove(e: React.MouseEvent) {
    if (!isDrawing || !drawingMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentDrawingPoints((prev) => [...prev, { x, y }]);
  }

  function handleDrawingEnd() {
    if (!isDrawing || currentDrawingPoints.length < 2) {
      setIsDrawing(false);
      setCurrentDrawingPoints([]);
      return;
    }
    const xs = currentDrawingPoints.map((p) => p.x);
    const ys = currentDrawingPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pad = drawingWidth * 2;
    const normalizedPoints = currentDrawingPoints.map((p) => ({
      x: p.x - minX + pad,
      y: p.y - minY + pad,
    }));
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const el: OverlayElement = {
      id: generateId(),
      type: "drawing",
      x: minX - pad,
      y: minY - pad,
      width: w,
      height: h,
      opacity: 1,
      rotation: 0,
      drawingPath: pointsToSvgPath(normalizedPoints),
      drawingColor: drawingColor,
      drawingWidth: drawingWidth,
      drawingViewBox: { w, h },
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    setIsDrawing(false);
    setCurrentDrawingPoints([]);
    setHasUnsaved(true);
  }

  function deleteElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
    setHasUnsaved(true);
  }

  function duplicateElement(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: generateId(), x: el.x + 20, y: el.y + 20 };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setHasUnsaved(true);
  }

  function moveElementOrder(id: string, dir: "up" | "down") {
    const idx = elements.findIndex((el) => el.id === id);
    if (idx < 0) return;
    const arr = [...elements];
    const target = dir === "up" ? idx + 1 : idx - 1;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setElements(arr);
    setHasUnsaved(true);
  }

  function getScale() {
    return zoom;
  }

  const pendingDragRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (drawingMode) return;
      e.stopPropagation();
      setSelectedId(elementId);
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;
      pendingDragRef.current = {
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        startElX: el.x,
        startElY: el.y,
      };
    },
    [elements, drawingMode]
  );

  const handleResizeDown = useCallback(
    (e: React.MouseEvent, elementId: string, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;
      setResizeState({
        elementId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startElX: el.x,
        startElY: el.y,
        startW: el.width,
        startH: el.height,
      });
    },
    [elements]
  );

  useEffect(() => {
    const DRAG_THRESHOLD = 3;
    function handleMouseMove(e: MouseEvent) {
      const scale = getScale();
      const pending = pendingDragRef.current;
      if (pending && !dragState) {
        const dx = Math.abs(e.clientX - pending.startX);
        const dy = Math.abs(e.clientY - pending.startY);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          setDragState(pending);
          pendingDragRef.current = null;
        }
        return;
      }
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / scale;
        const dy = (e.clientY - dragState.startY) / scale;
        const el = elements.find((el) => el.id === dragState.elementId);
        const w = el?.width || 100;
        const h = el?.height || 100;
        updateElement(dragState.elementId, {
          x: Math.round(Math.max(-w / 2, Math.min(CANVAS_WIDTH - w / 2, dragState.startElX + dx))),
          y: Math.round(Math.max(-h / 2, Math.min(CANVAS_HEIGHT - h / 2, dragState.startElY + dy))),
        });
      }
      if (resizeState) {
        const dx = (e.clientX - resizeState.startX) / scale;
        const dy = (e.clientY - resizeState.startY) / scale;
        const h = resizeState.handle;
        let newX = resizeState.startElX;
        let newY = resizeState.startElY;
        let newW = resizeState.startW;
        let newH = resizeState.startH;
        if (h.includes("e")) newW = Math.max(20, resizeState.startW + dx);
        if (h.includes("w")) { newW = Math.max(20, resizeState.startW - dx); newX = resizeState.startElX + (resizeState.startW - newW); }
        if (h.includes("s")) newH = Math.max(20, resizeState.startH + dy);
        if (h.includes("n")) { newH = Math.max(20, resizeState.startH - dy); newY = resizeState.startElY + (resizeState.startH - newH); }
        updateElement(resizeState.elementId, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      }
    }
    function handleMouseUp() {
      pendingDragRef.current = null;
      setDragState(null);
      setResizeState(null);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, resizeState, zoom, elements]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (selectedId) deleteElement(selectedId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveMutation.mutate();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elements, bgColor]);

  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <div className="flex flex-col h-full -m-6 bg-[#0a0a1a]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white/60 hover:text-white"
            onClick={() => {
              if (hasUnsaved) {
                if (window.confirm("You have unsaved changes. Leave without saving?")) onBack();
              } else onBack();
            }}
            data-testid="button-back-alerts"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-sm font-medium text-white/80">{alert.name}</span>
          {hasUnsaved && (
            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/40" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} data-testid="button-zoom-out">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-white/40 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/40" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} data-testid="button-zoom-in">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setShowTestPreview(true)}
            data-testid="button-test-alert"
          >
            <Play className="h-3.5 w-3.5" />
            Test
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-alert"
          >
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-12 border-r border-white/10 flex flex-col items-center py-3 gap-1 shrink-0 relative">
          <ToolBtn icon={<Type className="h-4 w-4" />} label="Text" onClick={() => addElement("text")} testId="alert-tool-text" />
          <ToolBtn icon={<Square className="h-4 w-4" />} label="Rectangle" onClick={() => addElement("rect")} testId="alert-tool-rect" />
          <ToolBtn icon={<Circle className="h-4 w-4" />} label="Circle" onClick={() => addElement("circle")} testId="alert-tool-circle" />
          <ToolBtn icon={<Image className="h-4 w-4" />} label="Image" onClick={() => addElement("image")} testId="alert-tool-image" />
          <div className="w-8 border-t border-white/10 my-1" />
          <ToolBtn
            icon={<Smile className="h-4 w-4" />}
            label="Stickers"
            onClick={() => { const next = !showStickerPicker; setShowStickerPicker(next); setShowAiGenerator(false); if (next && giphyStickers.length === 0) fetchGiphyTrending(); }}
            testId="alert-tool-sticker"
            active={showStickerPicker}
          />
          <ToolBtn
            icon={<PenTool className="h-4 w-4" />}
            label="Draw"
            onClick={() => { setDrawingMode(!drawingMode); setShowStickerPicker(false); setShowAiGenerator(false); setSelectedId(null); }}
            testId="alert-tool-draw"
            active={drawingMode}
          />
          <ToolBtn
            icon={<Sparkles className="h-4 w-4" />}
            label="AI Generate"
            onClick={() => { setShowAiGenerator(!showAiGenerator); setShowStickerPicker(false); }}
            testId="alert-tool-ai"
            active={showAiGenerator}
          />

          {showStickerPicker && (
            <div className="absolute left-14 top-0 z-50 w-80 rounded-xl border border-white/10 bg-[#12122a] shadow-2xl flex flex-col" style={{ maxHeight: 420 }}>
              <div className="p-3 pb-2 border-b border-white/10">
                <div className="text-xs font-medium text-white/60 mb-2">Giphy Stickers</div>
                <Input
                  value={giphySearch}
                  onChange={(e) => handleGiphySearchChange(e.target.value)}
                  placeholder="Search stickers..."
                  className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  data-testid="alert-input-giphy-search"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {giphyLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-purple-400" /></div>
                ) : giphyStickers.length === 0 ? (
                  <div className="text-center text-white/30 text-xs py-8">No stickers found</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {giphyStickers.map((s) => (
                      <button key={s.id} onClick={() => addGiphySticker(s)} className="rounded-lg hover:bg-white/10 p-1 transition flex items-center justify-center aspect-square overflow-hidden" title={s.title} data-testid={`alert-sticker-giphy-${s.id}`}>
                        <img src={s.previewUrl} alt={s.title} className="max-w-full max-h-full object-contain" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-white/10 flex items-center justify-center">
                <img src="https://giphy.com/static/img/poweredby_giphy.png" alt="Powered by GIPHY" className="h-3 opacity-40" />
              </div>
            </div>
          )}

          {showAiGenerator && (
            <div className="absolute left-14 top-0 z-50 w-72 rounded-xl border border-white/10 bg-[#12122a] p-4 shadow-2xl">
              <div className="text-xs font-medium text-white/60 mb-2">AI Image Generator</div>
              <p className="text-[10px] text-white/30 mb-3">Describe what you want and AI will create it</p>
              <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. A glowing subscribe button" className="bg-white/5 border-white/10 text-white h-8 text-xs mb-2" onKeyDown={(e) => e.key === "Enter" && generateAiImage()} disabled={aiGenerating} data-testid="alert-input-ai-prompt" />
              <Button size="sm" className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-xs" onClick={generateAiImage} disabled={!aiPrompt.trim() || aiGenerating} data-testid="alert-button-ai-generate">
                {aiGenerating ? (<><Loader2 className="h-3 w-3 animate-spin" />Generating...</>) : (<><Sparkles className="h-3 w-3" />Generate</>)}
              </Button>
              {aiGenerating && <p className="text-[10px] text-white/30 mt-2 text-center">This may take 10-20 seconds</p>}
              {aiError && <p className="text-[10px] text-red-400 mt-2 text-center">{aiError}</p>}
            </div>
          )}
        </div>

        {drawingMode && (
          <div className="w-48 border-r border-white/10 p-3 shrink-0">
            <div className="text-xs font-medium text-white/60 mb-3">Drawing Tool</div>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={drawingColor} onChange={(e) => setDrawingColor(e.target.value)} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-input-drawing-color" />
                  <Input value={drawingColor} onChange={(e) => setDrawingColor(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Brush Size: {drawingWidth}px</Label>
                <input type="range" min="1" max="20" value={drawingWidth} onChange={(e) => setDrawingWidth(Number(e.target.value))} className="accent-purple-500" data-testid="alert-input-drawing-width" />
              </div>
              <p className="text-[10px] text-white/30">Click and drag on the canvas to draw.</p>
              <Button size="sm" variant="outline" className="text-xs border-white/10 text-white/60" onClick={() => setDrawingMode(false)} data-testid="alert-button-stop-drawing">Stop Drawing</Button>
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-auto bg-[#080810] flex items-center justify-center p-8"
          onClick={() => { if (!drawingMode) setSelectedId(null); }}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
              backgroundColor: bgColor === "transparent" ? undefined : bgColor,
              ...(bgColor === "transparent" ? { background: `repeating-conic-gradient(#1a1a2e 0% 25%, #12122a 0% 50%) 0 0 / ${16 * zoom}px ${16 * zoom}px` } : {}),
              cursor: drawingMode ? "crosshair" : undefined,
            }}
            onMouseDown={drawingMode ? handleDrawingStart : undefined}
            onMouseMove={drawingMode ? handleDrawingMove : undefined}
            onMouseUp={drawingMode ? handleDrawingEnd : undefined}
            onMouseLeave={drawingMode ? handleDrawingEnd : undefined}
            data-testid="alert-canvas"
          >
            {elements.map((el) => (
              <div
                key={el.id}
                className={cn("absolute cursor-move group/el", selectedId === el.id && "ring-2 ring-purple-400")}
                style={{
                  left: el.x * zoom,
                  top: el.y * zoom,
                  width: el.width * zoom,
                  height: el.height * zoom,
                  opacity: el.opacity ?? 1,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                }}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
                data-testid={`alert-canvas-element-${el.id}`}
              >
                {el.type === "text" && (
                  <div className="w-full h-full flex items-center justify-center select-none overflow-hidden" style={{
                    fontSize: (el.fontSize || 36) * zoom,
                    fontFamily: el.fontFamily || "Outfit",
                    color: el.color || "#ffffff",
                    backgroundColor: el.fill !== "transparent" ? el.fill : undefined,
                    borderRadius: el.borderRadius ?? 0,
                    border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                  }}>
                    {el.text || "Text"}
                  </div>
                )}
                {el.type === "rect" && (
                  <div className="w-full h-full" style={{
                    backgroundColor: el.fill || "#8b5cf6",
                    borderRadius: el.borderRadius ?? 0,
                    border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                  }} />
                )}
                {el.type === "circle" && (
                  <div className="w-full h-full" style={{
                    backgroundColor: el.fill || "#8b5cf6",
                    borderRadius: "50%",
                    border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                  }} />
                )}
                {el.type === "image" && (
                  <div className="w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none" style={{ borderRadius: el.borderRadius ?? 0 }}>
                    {el.src ? (
                      <img src={el.src} alt="" className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center pointer-events-none">
                        <Image className="text-white/20" style={{ width: 24 * zoom, height: 24 * zoom }} />
                      </div>
                    )}
                  </div>
                )}
                {el.type === "sticker" && (
                  <div className="w-full h-full flex items-center justify-center select-none pointer-events-none">
                    {el.src ? (
                      <img src={el.src} alt={el.sticker || "sticker"} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                    ) : (
                      <span style={{ fontSize: Math.min(el.width, el.height) * zoom * 0.75 }}>{el.sticker || "🎮"}</span>
                    )}
                  </div>
                )}
                {el.type === "drawing" && el.drawingPath && (
                  <svg className="w-full h-full" viewBox={`0 0 ${el.drawingViewBox?.w || el.width} ${el.drawingViewBox?.h || el.height}`} preserveAspectRatio="none">
                    <path d={el.drawingPath} stroke={el.drawingColor || "#ffffff"} strokeWidth={el.drawingWidth || 4} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}

                {selectedId === el.id && handles.map((h) => (
                  <div
                    key={h}
                    className="absolute bg-white border-2 border-purple-500 rounded-sm z-10"
                    style={{
                      width: 8, height: 8, cursor: `${h}-resize`,
                      ...(h.includes("n") ? { top: -4 } : {}),
                      ...(h.includes("s") ? { bottom: -4 } : {}),
                      ...(h === "n" || h === "s" ? { left: "50%", marginLeft: -4 } : {}),
                      ...(h.includes("w") ? { left: -4 } : {}),
                      ...(h.includes("e") ? { right: -4 } : {}),
                      ...(h === "w" || h === "e" ? { top: "50%", marginTop: -4 } : {}),
                    }}
                    onMouseDown={(e) => handleResizeDown(e, el.id, h)}
                  />
                ))}
              </div>
            ))}

            {drawingMode && isDrawing && currentDrawingPoints.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom }} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
                <path d={pointsToSvgPath(currentDrawingPoints)} stroke={drawingColor} strokeWidth={drawingWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        <div className="w-64 border-l border-white/10 overflow-y-auto shrink-0">
          {selected ? (
            <ElementProps
              element={selected}
              onUpdate={(updates) => updateElement(selected.id, updates)}
              onDelete={() => deleteElement(selected.id)}
              onDuplicate={() => duplicateElement(selected.id)}
              onMoveUp={() => moveElementOrder(selected.id, "up")}
              onMoveDown={() => moveElementOrder(selected.id, "down")}
              zoom={zoom}
            />
          ) : (
            <div className="p-4">
              <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-4">Alert Settings</div>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label className="text-white/50 text-[11px]">Type</Label>
                  <Select value={alertType} onValueChange={(v) => { setAlertType(v); setHasUnsaved(true); }}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-editor-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-white/50 text-[11px]">Message</Label>
                  <Input value={alertMessage} onChange={(e) => { setAlertMessage(e.target.value); setHasUnsaved(true); }} placeholder="Thanks for the follow, {name}!" className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-editor-message" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-white/50 text-[11px]">Duration (seconds)</Label>
                  <Input type="number" value={alertDuration} onChange={(e) => { setAlertDuration(parseInt(e.target.value) || 5); setHasUnsaved(true); }} min={1} max={30} className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-editor-duration" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-white/50 text-[11px]">Animation</Label>
                  <Select value={alertAnimation} onValueChange={(v) => { setAlertAnimation(v); setHasUnsaved(true); }}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-editor-animation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {animations.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-white/50 text-[11px]">Accent Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={alertColor} onChange={(e) => { setAlertColor(e.target.value); setHasUnsaved(true); }} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-editor-color" />
                    <Input value={alertColor} onChange={(e) => { setAlertColor(e.target.value); setHasUnsaved(true); }} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                  </div>
                </div>
                <div className="w-full border-t border-white/10 my-1" />
                <div className="text-xs font-medium text-white/60 uppercase tracking-wider">Background</div>
                <div className="grid gap-1">
                  <div className="flex gap-2">
                    <input type="color" value={bgColor === "transparent" ? "#000000" : bgColor} onChange={(e) => { setBgColor(e.target.value); setHasUnsaved(true); }} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-editor-bg-color" />
                    <Input value={bgColor} onChange={(e) => { setBgColor(e.target.value); setHasUnsaved(true); }} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                  </div>
                  <Button variant="ghost" size="sm" className={cn("text-xs mt-1", bgColor === "transparent" ? "text-purple-400" : "text-white/40")} onClick={() => { setBgColor("transparent"); setHasUnsaved(true); }} data-testid="alert-editor-bg-transparent">
                    Transparent
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTestPreview && (
        <AlertTestPreview
          elements={elements}
          bgColor={bgColor}
          message={alertMessage}
          type={alertType}
          animation={alertAnimation}
          duration={alertDuration}
          accentColor={alertColor}
          onClose={() => setShowTestPreview(false)}
        />
      )}
    </div>
  );
}

function AlertTestPreview({ elements, bgColor, message, type, animation, duration, accentColor, onClose }: {
  elements: OverlayElement[];
  bgColor: string;
  message: string;
  type: string;
  animation: string;
  duration: number;
  accentColor: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const [timeLeft, setTimeLeft] = useState(duration);

  const sampleNames: Record<string, string> = {
    follower: "StreamFan42",
    donation: "GenerousGamer",
    subscriber: "SubSquad99",
  };
  const displayMsg = message.replace(/\{name\}/g, sampleNames[type] || "User123");

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("visible"), 600);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;
    if (timeLeft <= 0) {
      setPhase("exit");
      setTimeout(onClose, 600);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft, onClose]);

  const animationStyle = (): React.CSSProperties => {
    if (phase === "enter") {
      switch (animation) {
        case "fadeIn": return { opacity: 0, transition: "all 0.6s ease-out" };
        case "slideUp": return { opacity: 0, transform: "translateY(80px)", transition: "all 0.6s ease-out" };
        case "slideDown": return { opacity: 0, transform: "translateY(-80px)", transition: "all 0.6s ease-out" };
        case "bounce": return { opacity: 0, transform: "scale(0.3)", transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" };
        case "zoom": return { opacity: 0, transform: "scale(0)", transition: "all 0.6s ease-out" };
        default: return { opacity: 0, transition: "all 0.6s ease-out" };
      }
    }
    if (phase === "exit") {
      switch (animation) {
        case "fadeIn": return { opacity: 0, transition: "all 0.5s ease-in" };
        case "slideUp": return { opacity: 0, transform: "translateY(-80px)", transition: "all 0.5s ease-in" };
        case "slideDown": return { opacity: 0, transform: "translateY(80px)", transition: "all 0.5s ease-in" };
        case "bounce": return { opacity: 0, transform: "scale(0.3)", transition: "all 0.5s ease-in" };
        case "zoom": return { opacity: 0, transform: "scale(0)", transition: "all 0.5s ease-in" };
        default: return { opacity: 0, transition: "all 0.5s ease-in" };
      }
    }
    return { opacity: 1, transform: "translateY(0) scale(1)", transition: "all 0.6s ease-out" };
  };

  const CANVAS_W = 800;
  const CANVAS_H = 400;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="alert-test-overlay"
    >
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 text-white/60 text-sm">
          <span className="uppercase tracking-wider text-[11px] font-medium text-purple-400">Alert Preview</span>
          <span className="text-white/30">•</span>
          <span className="text-[11px]">{timeLeft > 0 ? `${timeLeft}s remaining` : "Closing..."}</span>
        </div>

        <div style={animationStyle()}>
          <div
            className="relative shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              backgroundColor: bgColor === "transparent" ? "transparent" : bgColor,
            }}
            data-testid="alert-test-canvas"
          >
            {elements.map((el) => (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  opacity: el.opacity ?? 1,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                }}
              >
                {el.type === "text" && (
                  <div className="w-full h-full flex items-center justify-center select-none overflow-hidden" style={{
                    fontSize: el.fontSize || 36,
                    fontFamily: el.fontFamily || "Outfit",
                    color: el.color || "#ffffff",
                    backgroundColor: el.fill !== "transparent" ? el.fill : undefined,
                    borderRadius: el.borderRadius ?? 0,
                    border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  }}>
                    {(el.text || "Text").replace(/\{name\}/g, sampleNames[type] || "User123")}
                  </div>
                )}
                {el.type === "rect" && (
                  <div className="w-full h-full" style={{
                    backgroundColor: el.fill || "#8b5cf6",
                    borderRadius: el.borderRadius ?? 0,
                    border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  }} />
                )}
                {el.type === "circle" && (
                  <div className="w-full h-full" style={{
                    backgroundColor: el.fill || "#8b5cf6",
                    borderRadius: "50%",
                    border: el.stroke && el.stroke !== "transparent" ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
                  }} />
                )}
                {el.type === "image" && (
                  <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{ borderRadius: el.borderRadius ?? 0 }}>
                    {el.src ? <img src={el.src} alt="" className="w-full h-full object-cover" draggable={false} /> : <div className="w-full h-full bg-white/10 flex items-center justify-center"><Image className="text-white/20 w-6 h-6" /></div>}
                  </div>
                )}
                {el.type === "sticker" && (
                  <div className="w-full h-full flex items-center justify-center select-none">
                    {el.src ? <img src={el.src} alt={el.sticker || "sticker"} className="w-full h-full object-contain" draggable={false} /> : <span style={{ fontSize: Math.min(el.width, el.height) * 0.75 }}>{el.sticker || "🎮"}</span>}
                  </div>
                )}
                {el.type === "drawing" && el.drawingPath && (
                  <svg className="w-full h-full" viewBox={`0 0 ${el.drawingViewBox?.w || el.width} ${el.drawingViewBox?.h || el.height}`} preserveAspectRatio="none">
                    <path d={el.drawingPath} stroke={el.drawingColor || "#ffffff"} strokeWidth={el.drawingWidth || 4} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg px-6 py-4 max-w-[800px] w-full" data-testid="alert-test-settings">
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="text-[11px] uppercase tracking-wider font-medium text-white/40">
                  {alertTypes.find((t) => t.value === type)?.label || type} Alert
                </span>
              </div>
              <p className="text-white text-sm font-medium truncate" data-testid="alert-test-message">{displayMsg}</p>
            </div>
            <div className="flex gap-6 shrink-0 text-[11px]">
              <div>
                <span className="text-white/30 block">Duration</span>
                <span className="text-white/70 font-medium">{duration}s</span>
              </div>
              <div>
                <span className="text-white/30 block">Animation</span>
                <span className="text-white/70 font-medium">{animations.find((a) => a.value === animation)?.label || animation}</span>
              </div>
              <div>
                <span className="text-white/30 block">Accent</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-3 w-3 rounded-sm border border-white/10" style={{ backgroundColor: accentColor }} />
                  <span className="text-white/70 font-mono text-[10px]">{accentColor}</span>
                </div>
              </div>
              <div>
                <span className="text-white/30 block">Background</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {bgColor === "transparent" ? (
                    <span className="text-white/70 text-[10px]">Transparent</span>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-sm border border-white/10" style={{ backgroundColor: bgColor }} />
                      <span className="text-white/70 font-mono text-[10px]">{bgColor}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-white/60 hover:text-white text-xs"
            onClick={onClose}
            data-testid="button-close-test-alert"
          >
            Close Preview
          </Button>
          <span className="text-white/30 text-[11px]">Click anywhere to close</span>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon, label, onClick, testId, active }: { icon: React.ReactNode; label: string; onClick: () => void; testId: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition", active ? "text-purple-400 bg-purple-500/20" : "text-white/50 hover:text-white hover:bg-white/10")}
      title={label}
      data-testid={testId}
    >
      {icon}
    </button>
  );
}

function PropInput({ label, value, onChange, testId }: { label: string; value: string | number; onChange: (v: string) => void; testId: string }) {
  return (
    <div className="grid gap-1">
      <Label className="text-white/50 text-[11px]">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid={testId} />
    </div>
  );
}

function ElementProps({
  element, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, zoom,
}: {
  element: OverlayElement;
  onUpdate: (updates: Partial<OverlayElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  zoom: number;
}) {
  const typeLabels: Record<string, string> = { text: "Text", rect: "Rectangle", circle: "Circle", image: "Image", sticker: "Sticker", drawing: "Drawing" };
  const typeLabel = typeLabels[element.type] || element.type;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-white/60 uppercase tracking-wider">{typeLabel}</div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveDown} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Move back" data-testid="alert-button-move-down"><MoveDown className="h-3 w-3" /></button>
          <button onClick={onMoveUp} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Move forward" data-testid="alert-button-move-up"><MoveUp className="h-3 w-3" /></button>
          <button onClick={onDuplicate} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Duplicate" data-testid="alert-button-duplicate"><Copy className="h-3 w-3" /></button>
          <button onClick={onDelete} className="h-6 w-6 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10" title="Delete" data-testid="alert-button-delete-element"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Position & Size</div>
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="X" value={element.x} onChange={(v) => onUpdate({ x: Number(v) })} testId="alert-prop-x" />
            <PropInput label="Y" value={element.y} onChange={(v) => onUpdate({ y: Number(v) })} testId="alert-prop-y" />
            <PropInput label="W" value={element.width} onChange={(v) => onUpdate({ width: Math.max(1, Number(v)) })} testId="alert-prop-w" />
            <PropInput label="H" value={element.height} onChange={(v) => onUpdate({ height: Math.max(1, Number(v)) })} testId="alert-prop-h" />
          </div>
        </div>

        {element.type === "text" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Text</div>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Content</Label>
                <Input value={element.text || ""} onChange={(e) => onUpdate({ text: e.target.value })} className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-prop-text-content" />
              </div>
              <PropInput label="Font Size" value={element.fontSize || 36} onChange={(v) => onUpdate({ fontSize: Math.max(1, Number(v)) })} testId="alert-prop-font-size" />
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Font</Label>
                <select value={element.fontFamily || "Outfit"} onChange={(e) => onUpdate({ fontFamily: e.target.value })} className="bg-white/5 border border-white/10 text-white h-8 text-xs rounded-md px-2" data-testid="alert-prop-font-family" style={{ fontFamily: element.fontFamily || "Outfit" }}>
                  <optgroup label="Clean">
                    <option value="Outfit" style={{ fontFamily: "Outfit" }}>Outfit</option>
                    <option value="Fredoka" style={{ fontFamily: "Fredoka" }}>Fredoka</option>
                    <option value="Righteous" style={{ fontFamily: "Righteous" }}>Righteous</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                  </optgroup>
                  <optgroup label="Monospace">
                    <option value="IBM Plex Mono" style={{ fontFamily: "IBM Plex Mono" }}>IBM Plex Mono</option>
                    <option value="Courier New">Courier New</option>
                  </optgroup>
                  <optgroup label="Display">
                    <option value="Bebas Neue" style={{ fontFamily: "Bebas Neue" }}>Bebas Neue</option>
                    <option value="Bangers" style={{ fontFamily: "Bangers" }}>Bangers</option>
                    <option value="Bungee" style={{ fontFamily: "Bungee" }}>Bungee</option>
                    <option value="Impact">Impact</option>
                    <option value="Titan One" style={{ fontFamily: "Titan One" }}>Titan One</option>
                    <option value="Luckiest Guy" style={{ fontFamily: "Luckiest Guy" }}>Luckiest Guy</option>
                  </optgroup>
                  <optgroup label="Gaming">
                    <option value="Press Start 2P" style={{ fontFamily: "Press Start 2P" }}>Press Start 2P</option>
                    <option value="Orbitron" style={{ fontFamily: "Orbitron" }}>Orbitron</option>
                    <option value="Chakra Petch" style={{ fontFamily: "Chakra Petch" }}>Chakra Petch</option>
                    <option value="Russo One" style={{ fontFamily: "Russo One" }}>Russo One</option>
                    <option value="Black Ops One" style={{ fontFamily: "Black Ops One" }}>Black Ops One</option>
                  </optgroup>
                  <optgroup label="Fun">
                    <option value="Permanent Marker" style={{ fontFamily: "Permanent Marker" }}>Permanent Marker</option>
                    <option value="Rubik Glitch" style={{ fontFamily: "Rubik Glitch" }}>Rubik Glitch</option>
                    <option value="Creepster" style={{ fontFamily: "Creepster" }}>Creepster</option>
                  </optgroup>
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Text Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={element.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-prop-text-color" />
                  <Input value={element.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["#ffffff","#000000","#ff0000","#ff4444","#ff8800","#ffcc00","#ffff00","#88ff00","#00ff00","#00ffcc","#00ccff","#0088ff","#0000ff","#8800ff","#ff00ff","#ff0088","#8b5cf6","#ec4899","#f97316","#14b8a6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ color: c })}
                      className={cn("h-5 w-5 rounded-sm border transition", element.color === c ? "border-white scale-110" : "border-white/20 hover:border-white/50")}
                      style={{ backgroundColor: c }}
                      data-testid={`alert-color-preset-${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(element.type === "rect" || element.type === "circle" || element.type === "text") && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Appearance</div>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Fill</Label>
                <div className="flex gap-2">
                  <input type="color" value={element.fill === "transparent" ? "#000000" : element.fill || "#8b5cf6"} onChange={(e) => onUpdate({ fill: e.target.value })} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-prop-fill" />
                  <Input value={element.fill || "transparent"} onChange={(e) => onUpdate({ fill: e.target.value })} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Stroke</Label>
                <div className="flex gap-2">
                  <input type="color" value={element.stroke === "transparent" ? "#000000" : element.stroke || "#000000"} onChange={(e) => onUpdate({ stroke: e.target.value })} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-prop-stroke" />
                  <Input value={element.stroke || "transparent"} onChange={(e) => onUpdate({ stroke: e.target.value })} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                </div>
              </div>
              <PropInput label="Stroke Width" value={element.strokeWidth || 0} onChange={(v) => onUpdate({ strokeWidth: Math.max(0, Number(v)) })} testId="alert-prop-stroke-width" />
              {element.type === "rect" && (
                <PropInput label="Corner Radius" value={element.borderRadius || 0} onChange={(v) => onUpdate({ borderRadius: Math.max(0, Number(v)) })} testId="alert-prop-border-radius" />
              )}
            </div>
          </div>
        )}

        {element.type === "image" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Image</div>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Image URL</Label>
                <Input value={element.src || ""} onChange={(e) => onUpdate({ src: e.target.value })} placeholder="https://..." className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-prop-image-url" />
              </div>
              <PropInput label="Corner Radius" value={element.borderRadius || 0} onChange={(v) => onUpdate({ borderRadius: Math.max(0, Number(v)) })} testId="alert-prop-image-radius" />
            </div>
          </div>
        )}

        {element.type === "sticker" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Sticker</div>
            <div className="grid gap-2">
              {element.src && (
                <div className="rounded-lg bg-white/5 p-2 flex items-center justify-center">
                  <img src={element.src} alt={element.sticker || "sticker"} className="max-h-20 object-contain" />
                </div>
              )}
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Source URL</Label>
                <Input value={element.src || ""} onChange={(e) => onUpdate({ src: e.target.value })} placeholder="Giphy URL" className="bg-white/5 border-white/10 text-white h-8 text-xs" data-testid="alert-prop-sticker-url" />
              </div>
            </div>
          </div>
        )}

        {element.type === "drawing" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Drawing</div>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Stroke Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={element.drawingColor || "#ffffff"} onChange={(e) => onUpdate({ drawingColor: e.target.value })} className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer" data-testid="alert-prop-drawing-color" />
                  <Input value={element.drawingColor || "#ffffff"} onChange={(e) => onUpdate({ drawingColor: e.target.value })} className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1" />
                </div>
              </div>
              <PropInput label="Stroke Width" value={element.drawingWidth || 4} onChange={(v) => onUpdate({ drawingWidth: Math.max(1, Number(v)) })} testId="alert-prop-drawing-width" />
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Transform</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-white/50 text-[11px]">Opacity</Label>
              <input type="range" min="0" max="1" step="0.05" value={element.opacity ?? 1} onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} className="accent-purple-500" data-testid="alert-prop-opacity" />
            </div>
            <PropInput label="Rotation" value={element.rotation || 0} onChange={(v) => onUpdate({ rotation: Number(v) })} testId="alert-prop-rotation" />
          </div>
        </div>
      </div>
    </div>
  );
}
