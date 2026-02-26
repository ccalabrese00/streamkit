import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Overlay } from "@shared/schema";

export interface OverlayElement {
  id: string;
  type: "text" | "rect" | "circle" | "image" | "sticker" | "drawing";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  src?: string;
  opacity?: number;
  rotation?: number;
  borderRadius?: number;
  sticker?: string;
  drawingPath?: string;
  drawingColor?: string;
  drawingWidth?: number;
  drawingViewBox?: { w: number; h: number };
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const STICKERS = [
  "🎮", "🎯", "🔥", "⚡", "💎", "🏆", "🎪", "🎨",
  "👑", "💀", "🤖", "👾", "🎸", "🎵", "💫", "✨",
  "❤️", "💜", "💙", "💚", "💛", "🧡", "🖤", "🤍",
  "🚀", "💣", "🎲", "🃏", "🏅", "⭐", "🌟", "💥",
  "😎", "🤠", "👻", "🎃", "🦄", "🐉", "🦊", "🐺",
  "⚔️", "🛡️", "🏹", "🔮", "💰", "📢", "🔔", "🎬",
];

function defaultElement(type: OverlayElement["type"]): OverlayElement {
  const base = { id: generateId(), x: 100, y: 100, opacity: 1, rotation: 0 };
  switch (type) {
    case "text":
      return { ...base, type: "text", width: 400, height: 60, text: "Your Text", fontSize: 48, fontFamily: "Outfit", color: "#ffffff", fill: "transparent", stroke: "transparent", strokeWidth: 0, borderRadius: 0 };
    case "rect":
      return { ...base, type: "rect", width: 300, height: 200, fill: "#8b5cf6", stroke: "transparent", strokeWidth: 0, borderRadius: 0 };
    case "circle":
      return { ...base, type: "circle", width: 200, height: 200, fill: "#8b5cf6", stroke: "transparent", strokeWidth: 0, borderRadius: 9999 };
    case "image":
      return { ...base, type: "image", width: 300, height: 200, src: "", borderRadius: 0 };
    case "sticker":
      return { ...base, type: "sticker", width: 120, height: 120, sticker: "🎮" };
    case "drawing":
      return { ...base, type: "drawing", width: 300, height: 300, drawingPath: "", drawingColor: "#ffffff", drawingWidth: 4 };
  }
}

export default function OverlayEditor({
  overlay,
  onBack,
}: {
  overlay: Overlay;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<OverlayElement[]>(
    (overlay.elements as OverlayElement[]) || []
  );
  const [bgColor, setBgColor] = useState(overlay.bgColor);
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
  const [zoom, setZoom] = useState(0.5);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#ffffff");
  const [drawingWidth, setDrawingWidth] = useState(4);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setElements((overlay.elements as OverlayElement[]) || []);
    setBgColor(overlay.bgColor);
    setSelectedId(null);
    setHasUnsaved(false);
  }, [overlay.id]);

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
      const res = await apiRequest("PUT", `/api/overlays/${overlay.id}`, {
        elements,
        bgColor,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overlays"] });
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

  function addSticker(emoji: string) {
    const el = defaultElement("sticker");
    el.sticker = emoji;
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
      el.width = 400;
      el.height = 400;
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
    const dup = { ...el, id: generateId(), x: el.x + 30, y: el.y + 30 };
    setElements((prev) => [...prev, dup]);
    setSelectedId(dup.id);
    setHasUnsaved(true);
  }

  function moveElementOrder(id: string, direction: "up" | "down") {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const newArr = [...prev];
      const target = direction === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= newArr.length) return prev;
      [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
      return newArr;
    });
    setHasUnsaved(true);
  }

  function getScale() {
    return zoom;
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (drawingMode) return;
      e.stopPropagation();
      e.preventDefault();
      setSelectedId(elementId);
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;
      setDragState({
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        startElX: el.x,
        startElY: el.y,
      });
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
    function handleMouseMove(e: MouseEvent) {
      const scale = getScale();
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
        if (h.includes("w")) {
          newW = Math.max(20, resizeState.startW - dx);
          newX = resizeState.startElX + (resizeState.startW - newW);
        }
        if (h.includes("s")) newH = Math.max(20, resizeState.startH + dy);
        if (h.includes("n")) {
          newH = Math.max(20, resizeState.startH - dy);
          newY = resizeState.startElY + (resizeState.startH - newH);
        }

        updateElement(resizeState.elementId, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    }

    function handleMouseUp() {
      setDragState(null);
      setResizeState(null);
    }

    if (dragState || resizeState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, resizeState, zoom]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedId) {
          deleteElement(selectedId);
        }
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
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white/60 hover:text-white"
            onClick={() => {
              if (hasUnsaved) {
                if (window.confirm("You have unsaved changes. Leave without saving?")) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
            data-testid="button-back-overlays"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-sm font-medium text-white/80">{overlay.name}</span>
          {hasUnsaved && (
            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/40"
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              data-testid="button-zoom-out"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-white/40 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/40"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              data-testid="button-zoom-in"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-overlay"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-12 border-r border-white/10 flex flex-col items-center py-3 gap-1 shrink-0 relative">
          <ToolButton
            icon={<Type className="h-4 w-4" />}
            label="Text"
            onClick={() => addElement("text")}
            testId="tool-text"
          />
          <ToolButton
            icon={<Square className="h-4 w-4" />}
            label="Rectangle"
            onClick={() => addElement("rect")}
            testId="tool-rect"
          />
          <ToolButton
            icon={<Circle className="h-4 w-4" />}
            label="Circle"
            onClick={() => addElement("circle")}
            testId="tool-circle"
          />
          <ToolButton
            icon={<Image className="h-4 w-4" />}
            label="Image"
            onClick={() => addElement("image")}
            testId="tool-image"
          />

          <div className="w-8 border-t border-white/10 my-1" />

          <ToolButton
            icon={<Smile className="h-4 w-4" />}
            label="Stickers"
            onClick={() => { setShowStickerPicker(!showStickerPicker); setShowAiGenerator(false); }}
            testId="tool-sticker"
            active={showStickerPicker}
          />
          <ToolButton
            icon={<PenTool className="h-4 w-4" />}
            label="Draw"
            onClick={() => { setDrawingMode(!drawingMode); setShowStickerPicker(false); setShowAiGenerator(false); setSelectedId(null); }}
            testId="tool-draw"
            active={drawingMode}
          />
          <ToolButton
            icon={<Sparkles className="h-4 w-4" />}
            label="AI Generate"
            onClick={() => { setShowAiGenerator(!showAiGenerator); setShowStickerPicker(false); }}
            testId="tool-ai"
            active={showAiGenerator}
          />

          {showStickerPicker && (
            <div className="absolute left-14 top-0 z-50 w-64 rounded-xl border border-white/10 bg-[#12122a] p-3 shadow-2xl">
              <div className="text-xs font-medium text-white/60 mb-2">Stickers</div>
              <div className="grid grid-cols-8 gap-1">
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSticker(s)}
                    className="h-8 w-8 rounded hover:bg-white/10 flex items-center justify-center text-lg transition"
                    data-testid={`sticker-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAiGenerator && (
            <div className="absolute left-14 top-0 z-50 w-72 rounded-xl border border-white/10 bg-[#12122a] p-4 shadow-2xl">
              <div className="text-xs font-medium text-white/60 mb-2">AI Image Generator</div>
              <p className="text-[10px] text-white/30 mb-3">Describe what you want and AI will create it for your overlay</p>
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. A glowing neon crown with purple flames"
                className="bg-white/5 border-white/10 text-white h-8 text-xs mb-2"
                onKeyDown={(e) => e.key === "Enter" && generateAiImage()}
                disabled={aiGenerating}
                data-testid="input-ai-prompt"
              />
              <Button
                size="sm"
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-xs"
                onClick={generateAiImage}
                disabled={!aiPrompt.trim() || aiGenerating}
                data-testid="button-ai-generate"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Generate
                  </>
                )}
              </Button>
              {aiGenerating && (
                <p className="text-[10px] text-white/30 mt-2 text-center">This may take 10-20 seconds</p>
              )}
              {aiError && (
                <p className="text-[10px] text-red-400 mt-2 text-center">{aiError}</p>
              )}
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
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    data-testid="input-drawing-color"
                  />
                  <Input
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Brush Size: {drawingWidth}px</Label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={drawingWidth}
                  onChange={(e) => setDrawingWidth(Number(e.target.value))}
                  className="accent-purple-500"
                  data-testid="input-drawing-width"
                />
              </div>
              <p className="text-[10px] text-white/30">Click and drag on the canvas to draw. Each stroke becomes a movable element.</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-white/10 text-white/60"
                onClick={() => setDrawingMode(false)}
                data-testid="button-stop-drawing"
              >
                Stop Drawing
              </Button>
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
              backgroundImage: bgColor === "transparent"
                ? "linear-gradient(45deg, #1a1a2e 25%, transparent 25%, transparent 75%, #1a1a2e 75%), linear-gradient(45deg, #1a1a2e 25%, transparent 25%, transparent 75%, #1a1a2e 75%)"
                : "linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%)",
              backgroundSize: bgColor === "transparent" ? `${16 * zoom}px ${16 * zoom}px` : `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: bgColor === "transparent" ? `0 0, ${8 * zoom}px ${8 * zoom}px` : `0 0, ${10 * zoom}px ${10 * zoom}px`,
              ...(bgColor === "transparent" ? { background: `repeating-conic-gradient(#1a1a2e 0% 25%, #12122a 0% 50%) 0 0 / ${16 * zoom}px ${16 * zoom}px` } : {}),
              cursor: drawingMode ? "crosshair" : undefined,
            }}
            onMouseDown={drawingMode ? handleDrawingStart : undefined}
            onMouseMove={drawingMode ? handleDrawingMove : undefined}
            onMouseUp={drawingMode ? handleDrawingEnd : undefined}
            onMouseLeave={drawingMode ? handleDrawingEnd : undefined}
            data-testid="overlay-canvas"
          >
            {elements.map((el) => (
              <div
                key={el.id}
                className={cn(
                  "absolute cursor-move group/el",
                  selectedId === el.id && "ring-2 ring-purple-400"
                )}
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
                data-testid={`canvas-element-${el.id}`}
              >
                {el.type === "text" && (
                  <div
                    className="w-full h-full flex items-center justify-center select-none overflow-hidden"
                    style={{
                      fontSize: (el.fontSize || 48) * zoom,
                      fontFamily: el.fontFamily || "Outfit",
                      color: el.color || "#ffffff",
                      backgroundColor: el.fill !== "transparent" ? el.fill : undefined,
                      borderRadius: el.borderRadius ?? 0,
                      border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                    }}
                  >
                    {el.text || "Text"}
                  </div>
                )}
                {el.type === "rect" && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fill || "#8b5cf6",
                      borderRadius: el.borderRadius ?? 0,
                      border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                    }}
                  />
                )}
                {el.type === "circle" && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fill || "#8b5cf6",
                      borderRadius: "50%",
                      border: el.stroke && el.stroke !== "transparent" ? `${(el.strokeWidth || 1) * zoom}px solid ${el.stroke}` : undefined,
                    }}
                  />
                )}
                {el.type === "image" && (
                  <div
                    className="w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none"
                    style={{ borderRadius: el.borderRadius ?? 0 }}
                  >
                    {el.src ? (
                      <img
                        src={el.src}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center pointer-events-none">
                        <Image
                          className="text-white/20"
                          style={{ width: 24 * zoom, height: 24 * zoom }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {el.type === "sticker" && (
                  <div
                    className="w-full h-full flex items-center justify-center select-none"
                    style={{ fontSize: Math.min(el.width, el.height) * zoom * 0.75 }}
                  >
                    {el.sticker || "🎮"}
                  </div>
                )}
                {el.type === "drawing" && el.drawingPath && (
                  <svg
                    className="w-full h-full"
                    viewBox={`0 0 ${el.drawingViewBox?.w || el.width} ${el.drawingViewBox?.h || el.height}`}
                    preserveAspectRatio="none"
                  >
                    <path
                      d={el.drawingPath}
                      stroke={el.drawingColor || "#ffffff"}
                      strokeWidth={el.drawingWidth || 4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}

                {selectedId === el.id &&
                  handles.map((h) => (
                    <div
                      key={h}
                      className="absolute bg-white border-2 border-purple-500 rounded-sm z-10"
                      style={{
                        width: 8,
                        height: 8,
                        cursor: `${h}-resize`,
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
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom }}
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              >
                <path
                  d={pointsToSvgPath(currentDrawingPoints)}
                  stroke={drawingColor}
                  strokeWidth={drawingWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="w-64 border-l border-white/10 overflow-y-auto shrink-0">
          {selected ? (
            <ElementProperties
              element={selected}
              onUpdate={(updates) => updateElement(selected.id, updates)}
              onDelete={() => deleteElement(selected.id)}
              onDuplicate={() => duplicateElement(selected.id)}
              onMoveUp={() => moveElementOrder(selected.id, "up")}
              onMoveDown={() => moveElementOrder(selected.id, "down")}
            />
          ) : (
            <CanvasProperties bgColor={bgColor} onBgColorChange={(c) => { setBgColor(c); setHasUnsaved(true); }} />
          )}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  testId,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  testId: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center transition",
        active ? "text-purple-400 bg-purple-500/20" : "text-white/50 hover:text-white hover:bg-white/10"
      )}
      title={label}
      data-testid={testId}
    >
      {icon}
    </button>
  );
}

function CanvasProperties({
  bgColor,
  onBgColorChange,
}: {
  bgColor: string;
  onBgColorChange: (c: string) => void;
}) {
  const isTransparent = bgColor === "transparent";

  return (
    <div className="p-4">
      <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-4">
        Canvas
      </div>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-white/50 text-[11px]">Background</Label>
          <button
            onClick={() => onBgColorChange(isTransparent ? "#0a0a1a" : "transparent")}
            className={cn(
              "flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-xs font-medium transition",
              isTransparent
                ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            )}
            data-testid="button-transparent-bg"
          >
            <div
              className="h-4 w-4 rounded border border-white/20 shrink-0"
              style={{
                background: isTransparent
                  ? "repeating-conic-gradient(#444 0% 25%, #666 0% 50%) 0 0 / 8px 8px"
                  : undefined,
              }}
            />
            Transparent
          </button>
          {!isTransparent && (
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                data-testid="input-canvas-bg"
              />
              <Input
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                data-testid="input-canvas-bg-hex"
              />
            </div>
          )}
        </div>
        <div className="text-[10px] text-white/30 mt-2">
          1920 x 1080px canvas
        </div>
        <div className="text-[10px] text-white/30">
          Click an element to edit its properties
        </div>
      </div>
    </div>
  );
}

function ElementProperties({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  element: OverlayElement;
  onUpdate: (updates: Partial<OverlayElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const typeLabels: Record<string, string> = { text: "Text", rect: "Rectangle", circle: "Circle", image: "Image", sticker: "Sticker", drawing: "Drawing" };
  const typeLabel = typeLabels[element.type] || element.type;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
          {typeLabel}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveDown} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Move back" data-testid="button-move-down">
            <MoveDown className="h-3 w-3" />
          </button>
          <button onClick={onMoveUp} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Move forward" data-testid="button-move-up">
            <MoveUp className="h-3 w-3" />
          </button>
          <button onClick={onDuplicate} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Duplicate" data-testid="button-duplicate">
            <Copy className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="h-6 w-6 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10" title="Delete" data-testid="button-delete-element">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Position & Size</div>
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="X" value={element.x} onChange={(v) => onUpdate({ x: Number(v) })} testId="prop-x" />
            <PropInput label="Y" value={element.y} onChange={(v) => onUpdate({ y: Number(v) })} testId="prop-y" />
            <PropInput label="W" value={element.width} onChange={(v) => onUpdate({ width: Math.max(1, Number(v)) })} testId="prop-w" />
            <PropInput label="H" value={element.height} onChange={(v) => onUpdate({ height: Math.max(1, Number(v)) })} testId="prop-h" />
          </div>
        </div>

        {element.type === "text" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Text</div>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Content</Label>
                <Input
                  value={element.text || ""}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  data-testid="prop-text-content"
                />
              </div>
              <PropInput
                label="Font Size"
                value={element.fontSize || 48}
                onChange={(v) => onUpdate({ fontSize: Math.max(1, Number(v)) })}
                testId="prop-font-size"
              />
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Font</Label>
                <select
                  value={element.fontFamily || "Outfit"}
                  onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                  className="bg-white/5 border border-white/10 text-white h-8 text-xs rounded-md px-2"
                  data-testid="prop-font-family"
                >
                  <option value="Outfit">Outfit</option>
                  <option value="IBM Plex Mono">IBM Plex Mono</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Impact">Impact</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Text Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.color || "#ffffff"}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    data-testid="prop-text-color"
                  />
                  <Input
                    value={element.color || "#ffffff"}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                  />
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
                  <input
                    type="color"
                    value={element.fill === "transparent" ? "#000000" : element.fill || "#8b5cf6"}
                    onChange={(e) => onUpdate({ fill: e.target.value })}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    data-testid="prop-fill"
                  />
                  <Input
                    value={element.fill || "transparent"}
                    onChange={(e) => onUpdate({ fill: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-white/50 text-[11px]">Stroke</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.stroke === "transparent" ? "#000000" : element.stroke || "#000000"}
                    onChange={(e) => onUpdate({ stroke: e.target.value })}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    data-testid="prop-stroke"
                  />
                  <Input
                    value={element.stroke || "transparent"}
                    onChange={(e) => onUpdate({ stroke: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <PropInput
                label="Stroke Width"
                value={element.strokeWidth || 0}
                onChange={(v) => onUpdate({ strokeWidth: Math.max(0, Number(v)) })}
                testId="prop-stroke-width"
              />
              {element.type === "rect" && (
                <PropInput
                  label="Corner Radius"
                  value={element.borderRadius || 0}
                  onChange={(v) => onUpdate({ borderRadius: Math.max(0, Number(v)) })}
                  testId="prop-border-radius"
                />
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
                <Input
                  value={element.src || ""}
                  onChange={(e) => onUpdate({ src: e.target.value })}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white h-8 text-xs"
                  data-testid="prop-image-url"
                />
              </div>
              <PropInput
                label="Corner Radius"
                value={element.borderRadius || 0}
                onChange={(v) => onUpdate({ borderRadius: Math.max(0, Number(v)) })}
                testId="prop-image-radius"
              />
            </div>
          </div>
        )}

        {element.type === "sticker" && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Sticker</div>
            <div className="grid grid-cols-8 gap-1">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate({ sticker: s })}
                  className={cn(
                    "h-8 w-8 rounded flex items-center justify-center text-lg transition",
                    element.sticker === s ? "bg-purple-500/30 ring-1 ring-purple-400" : "hover:bg-white/10"
                  )}
                  data-testid={`prop-sticker-${s}`}
                >
                  {s}
                </button>
              ))}
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
                  <input
                    type="color"
                    value={element.drawingColor || "#ffffff"}
                    onChange={(e) => onUpdate({ drawingColor: e.target.value })}
                    className="h-8 w-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    data-testid="prop-drawing-color"
                  />
                  <Input
                    value={element.drawingColor || "#ffffff"}
                    onChange={(e) => onUpdate({ drawingColor: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <PropInput
                label="Stroke Width"
                value={element.drawingWidth || 4}
                onChange={(v) => onUpdate({ drawingWidth: Math.max(1, Number(v)) })}
                testId="prop-drawing-width"
              />
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Transform</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-white/50 text-[11px]">Opacity</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={element.opacity ?? 1}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
                className="accent-purple-500"
                data-testid="prop-opacity"
              />
            </div>
            <PropInput
              label="Rotation"
              value={element.rotation || 0}
              onChange={(v) => onUpdate({ rotation: Number(v) })}
              testId="prop-rotation"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PropInput({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-white/50 text-[11px]">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border-white/10 text-white h-8 text-xs font-mono"
        data-testid={testId}
      />
    </div>
  );
}
