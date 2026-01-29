import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Type,
  Users,
  Music,
  Clock,
  Image,
  MessageSquare,
  Trash2,
  Copy,
  Save,
  ExternalLink,
  ArrowLeft,
  Wand2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  type OverlayElement,
  type CustomOverlay,
  type ElementType,
  createElement,
  createOverlay,
  loadOverlays,
  saveOverlays,
  encodeOverlayToQuery,
} from "@/lib/overlayConfig";
import { Link } from "wouter";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRID_SIZE = 20;

const elementIcons: Record<ElementType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  socials: <Users className="h-4 w-4" />,
  nowPlaying: <Music className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  logo: <Image className="h-4 w-4" />,
  chatPreview: <MessageSquare className="h-4 w-4" />,
};

const elementLabels: Record<ElementType, string> = {
  text: "Text",
  socials: "Socials",
  nowPlaying: "Now Playing",
  clock: "Clock",
  logo: "Logo",
  chatPreview: "Chat",
};

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string;
  startX: number;
  startY: number;
  startElX: number;
  startElY: number;
  startElW: number;
  startElH: number;
}

function OverlayElementView({
  element,
  selected,
  onSelect,
  onUpdate,
  scale,
  snapEnabled,
}: {
  element: OverlayElement;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OverlayElement>) => void;
  scale: number;
  snapEnabled: boolean;
}) {
  const [time, setTime] = useState(new Date());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: "",
    startX: 0,
    startY: 0,
    startElX: 0,
    startElY: 0,
    startElW: 0,
    startElH: 0,
  });

  useEffect(() => {
    if (element.type === "clock") {
      const interval = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [element.type]);

  const handleMouseDown = (e: React.MouseEvent, resizeHandle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const newState: DragState = {
      isDragging: !resizeHandle,
      isResizing: !!resizeHandle,
      resizeHandle: resizeHandle || "",
      startX: e.clientX,
      startY: e.clientY,
      startElX: element.x,
      startElY: element.y,
      startElW: element.width,
      startElH: element.height,
    };
    setDragState(newState);

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - newState.startX) / scale;
      const dy = (e.clientY - newState.startY) / scale;

      if (newState.isResizing) {
        let newX = newState.startElX;
        let newY = newState.startElY;
        let newW = newState.startElW;
        let newH = newState.startElH;

        if (newState.resizeHandle.includes("e")) newW = Math.max(50, newState.startElW + dx);
        if (newState.resizeHandle.includes("w")) {
          newW = Math.max(50, newState.startElW - dx);
          newX = newState.startElX + (newState.startElW - newW);
        }
        if (newState.resizeHandle.includes("s")) newH = Math.max(30, newState.startElH + dy);
        if (newState.resizeHandle.includes("n")) {
          newH = Math.max(30, newState.startElH - dy);
          newY = newState.startElY + (newState.startElH - newH);
        }

        if (snapEnabled) {
          newX = snapToGrid(newX, GRID_SIZE);
          newY = snapToGrid(newY, GRID_SIZE);
          newW = snapToGrid(newW, GRID_SIZE);
          newH = snapToGrid(newH, GRID_SIZE);
        }

        newX = clamp(newX, 0, CANVAS_WIDTH - newW);
        newY = clamp(newY, 0, CANVAS_HEIGHT - newH);

        onUpdate({ x: newX, y: newY, width: newW, height: newH });
      } else {
        let newX = newState.startElX + dx;
        let newY = newState.startElY + dy;

        if (snapEnabled) {
          newX = snapToGrid(newX, GRID_SIZE);
          newY = snapToGrid(newY, GRID_SIZE);
        }

        newX = clamp(newX, 0, CANVAS_WIDTH - element.width);
        newY = clamp(newY, 0, CANVAS_HEIGHT - element.height);

        onUpdate({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setDragState((prev) => ({ ...prev, isDragging: false, isResizing: false }));
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const renderContent = () => {
    switch (element.type) {
      case "clock":
        return <span className="font-mono">{formatTime(time)}</span>;
      case "chatPreview":
        return (
          <div className="flex flex-col gap-1 text-xs w-full">
            <div><span className="text-purple-400">viewer123:</span> let's goooo</div>
            <div><span className="text-cyan-400">streamer_fan:</span> hype!</div>
            <div><span className="text-pink-400">newbie_here:</span> first time!</div>
          </div>
        );
      case "logo":
        return <div className="text-3xl">✦</div>;
      case "socials":
        return (
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[0.6em] opacity-60 uppercase tracking-wider">Follow</div>
            <div>{element.content || "@username"}</div>
          </div>
        );
      case "nowPlaying":
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <div className="text-[0.6em] opacity-60 uppercase">Now Playing</div>
              <div className="truncate">{element.content || "Lo-fi Beats"}</div>
            </div>
          </div>
        );
      default:
        return <span>{element.content || "Text"}</span>;
    }
  };

  const resizeHandles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];

  return (
    <div
      className={cn(
        "absolute select-none",
        (dragState.isDragging || dragState.isResizing) && "z-50"
      )}
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
      }}
      data-testid={`element-${element.id}`}
    >
      <div
        className={cn(
          "w-full h-full rounded-lg overflow-hidden cursor-move transition-shadow",
          selected && "ring-2 ring-white/80 shadow-lg shadow-white/20"
        )}
        style={{
          backgroundColor: `${element.bgColor}${Math.round(element.bgOpacity * 255).toString(16).padStart(2, "0")}`,
          color: element.color,
          fontSize: element.fontSize * scale,
          fontWeight: element.fontWeight,
          textAlign: element.textAlign,
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        <div className="flex items-center justify-center h-full w-full p-2">
          {renderContent()}
        </div>
      </div>

      {selected && (
        <>
          {resizeHandles.map((handle) => {
            const isCorner = handle.length === 2;
            const size = isCorner ? 10 : 8;
            const pos: React.CSSProperties = {};

            if (handle.includes("n")) pos.top = -size / 2;
            if (handle.includes("s")) pos.bottom = -size / 2;
            if (handle.includes("w")) pos.left = -size / 2;
            if (handle.includes("e")) pos.right = -size / 2;
            if (handle === "n" || handle === "s") {
              pos.left = "50%";
              pos.transform = "translateX(-50%)";
            }
            if (handle === "e" || handle === "w") {
              pos.top = "50%";
              pos.transform = "translateY(-50%)";
            }

            const cursor = {
              nw: "nw-resize",
              ne: "ne-resize",
              sw: "sw-resize",
              se: "se-resize",
              n: "n-resize",
              s: "s-resize",
              e: "e-resize",
              w: "w-resize",
            }[handle];

            return (
              <div
                key={handle}
                className="absolute bg-white rounded-sm shadow-md border border-black/20"
                style={{
                  width: size,
                  height: size,
                  cursor,
                  ...pos,
                }}
                onMouseDown={(e) => handleMouseDown(e, handle)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default function OverlayBuilder() {
  const [overlay, setOverlay] = useState<CustomOverlay>(createOverlay);
  const [savedOverlays, setSavedOverlays] = useState<CustomOverlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(0.5);

  const selectedElement = overlay.elements.find((e) => e.id === selectedId);

  useEffect(() => {
    setSavedOverlays(loadOverlays());
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current) {
        const containerWidth = canvasRef.current.parentElement?.clientWidth || 800;
        const newScale = Math.min((containerWidth - 32) / CANVAS_WIDTH, 0.6);
        setCanvasScale(newScale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const addElement = useCallback((type: ElementType) => {
    const el = createElement(type, 100, 100);
    setOverlay((prev) => ({
      ...prev,
      elements: [...prev.elements, el],
      updatedAt: Date.now(),
    }));
    setSelectedId(el.id);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<OverlayElement>) => {
    setOverlay((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      updatedAt: Date.now(),
    }));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setOverlay((prev) => ({
      ...prev,
      elements: prev.elements.filter((e) => e.id !== id),
      updatedAt: Date.now(),
    }));
    setSelectedId(null);
    setHiddenElements((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const moveElement = useCallback((id: string, direction: "up" | "down") => {
    setOverlay((prev) => {
      const idx = prev.elements.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= prev.elements.length) return prev;
      const newElements = [...prev.elements];
      [newElements[idx], newElements[newIdx]] = [newElements[newIdx], newElements[idx]];
      return { ...prev, elements: newElements, updatedAt: Date.now() };
    });
  }, []);

  const toggleElementVisibility = useCallback((id: string) => {
    setHiddenElements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const saveCurrentOverlay = useCallback(() => {
    const updated = { ...overlay, updatedAt: Date.now() };
    const existing = savedOverlays.findIndex((o) => o.id === overlay.id);
    let newList: CustomOverlay[];
    if (existing >= 0) {
      newList = savedOverlays.map((o, i) => (i === existing ? updated : o));
    } else {
      newList = [updated, ...savedOverlays];
    }
    setSavedOverlays(newList);
    saveOverlays(newList);
    setOverlay(updated);
    toast({ title: "Overlay saved!" });
  }, [overlay, savedOverlays]);

  const loadOverlayItem = useCallback((o: CustomOverlay) => {
    setOverlay(o);
    setSelectedId(null);
    setHiddenElements(new Set());
    toast({ title: "Overlay loaded" });
  }, []);

  const deleteOverlay = useCallback((id: string) => {
    const newList = savedOverlays.filter((o) => o.id !== id);
    setSavedOverlays(newList);
    saveOverlays(newList);
    toast({ title: "Overlay deleted" });
  }, [savedOverlays]);

  const newOverlay = useCallback(() => {
    setOverlay(createOverlay());
    setSelectedId(null);
    setHiddenElements(new Set());
  }, []);

  const copyLink = async () => {
    const encoded = encodeOverlayToQuery(overlay);
    const url = `${window.location.origin}/overlay/view?d=${encoded}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    toast({ title: "OBS link copied!" });
  };

  const generateAIOverlay = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    try {
      const response = await fetch("/api/generate-overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!response.ok) throw new Error("Failed to generate");
      const data = await response.json();
      const newElements: OverlayElement[] = (data.elements || []).map((el: Partial<OverlayElement>, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        type: el.type || "text",
        x: el.x || 50,
        y: el.y || 50,
        width: el.width || 200,
        height: el.height || 60,
        content: el.content || "",
        fontSize: el.fontSize || 24,
        color: el.color || "#ffffff",
        bgColor: el.bgColor || "#000000",
        bgOpacity: el.bgOpacity ?? 0.5,
        fontWeight: el.fontWeight || "normal",
        textAlign: el.textAlign || "center",
      }));
      setOverlay((prev) => ({
        ...prev,
        name: data.name || prev.name,
        bgColor: data.bgColor || prev.bgColor,
        elements: newElements,
        updatedAt: Date.now(),
      }));
      setAiPrompt("");
      setSelectedId(null);
      setHiddenElements(new Set());
      toast({ title: "Overlay generated!" });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const obsUrl = `/overlay/view?d=${encodeOverlayToQuery(overlay)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Input
              value={overlay.name}
              onChange={(e) => setOverlay((p) => ({ ...p, name: e.target.value }))}
              className="bg-white/5 text-white/90 text-lg font-semibold border-white/10 w-48"
              data-testid="input-overlay-name"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={newOverlay} data-testid="button-new">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button variant="secondary" size="sm" onClick={saveCurrentOverlay} data-testid="button-save">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="secondary" size="sm" onClick={copyLink} data-testid="button-copy-link">
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copied!" : "OBS Link"}
            </Button>
            <a href={obsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" data-testid="button-preview">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </a>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/50 mr-2">Add:</span>
              {(Object.keys(elementIcons) as ElementType[]).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => addElement(type)}
                  data-testid={`button-add-${type}`}
                >
                  {elementIcons[type]}
                  {elementLabels[type]}
                </Button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs text-white/60" htmlFor="snap-toggle">Snap</Label>
                <input
                  id="snap-toggle"
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-snap"
                />
              </div>
            </div>

            <div
              ref={canvasRef}
              className="relative rounded-xl border-2 border-white/10 overflow-hidden bg-neutral-900"
              style={{
                width: CANVAS_WIDTH * canvasScale,
                height: CANVAS_HEIGHT * canvasScale,
                backgroundColor: overlay.bgColor,
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
              data-testid="canvas-overlay"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, white 1px, transparent 1px),
                    linear-gradient(to bottom, white 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE * canvasScale}px ${GRID_SIZE * canvasScale}px`,
                }}
              />
              {overlay.elements
                .filter((el) => !hiddenElements.has(el.id))
                .map((el) => (
                  <OverlayElementView
                    key={el.id}
                    element={el}
                    selected={selectedId === el.id}
                    onSelect={() => setSelectedId(el.id)}
                    onUpdate={(updates) => updateElement(el.id, updates)}
                    scale={canvasScale}
                    snapEnabled={snapEnabled}
                  />
                ))}
            </div>

            <div className="text-xs text-white/40 text-center">
              Canvas: {CANVAS_WIDTH}×{CANVAS_HEIGHT} • Click to select • Drag to move • Corners to resize
            </div>
          </div>

          <div className="space-y-3">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white/90 mb-2">
                <Wand2 className="h-4 w-4 text-purple-400" />
                AI Generator
              </div>
              <Textarea
                placeholder="e.g., 'cozy lo-fi gaming overlay'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="bg-white/5 text-white/90 text-sm min-h-[50px] mb-2"
                disabled={aiGenerating}
                data-testid="input-ai-prompt"
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-2"
                onClick={generateAIOverlay}
                disabled={!aiPrompt.trim() || aiGenerating}
                data-testid="button-ai-generate"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            <div className="glass rounded-xl p-3">
              <div className="text-sm font-medium text-white/90 mb-2">Canvas</div>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={overlay.bgColor}
                  onChange={(e) => setOverlay((p) => ({ ...p, bgColor: e.target.value }))}
                  className="h-8 w-10 rounded cursor-pointer border-none"
                />
                <Input
                  value={overlay.bgColor}
                  onChange={(e) => setOverlay((p) => ({ ...p, bgColor: e.target.value }))}
                  className="bg-white/5 text-white/90 text-sm flex-1 h-8"
                />
              </div>
            </div>

            <div className="glass rounded-xl p-3">
              <div className="text-sm font-medium text-white/90 mb-2">Layers</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {[...overlay.elements].reverse().map((el, idx) => (
                  <div
                    key={el.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition",
                      selectedId === el.id ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
                    )}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <GripVertical className="h-3 w-3 text-white/30" />
                    <span className="text-white/60">{elementIcons[el.type]}</span>
                    <span className="flex-1 truncate text-white/80">
                      {el.type === "text" ? el.content || "Text" : elementLabels[el.type]}
                    </span>
                    <button
                      className="p-0.5 hover:bg-white/10 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleElementVisibility(el.id);
                      }}
                      data-testid={`button-visibility-${el.id}`}
                    >
                      {hiddenElements.has(el.id) ? (
                        <EyeOff className="h-3 w-3 text-white/40" />
                      ) : (
                        <Eye className="h-3 w-3 text-white/60" />
                      )}
                    </button>
                    <button
                      className="p-0.5 hover:bg-white/10 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(el.id, "up");
                      }}
                      data-testid={`button-layer-up-${el.id}`}
                    >
                      <ChevronUp className="h-3 w-3 text-white/60" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-white/10 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(el.id, "down");
                      }}
                      data-testid={`button-layer-down-${el.id}`}
                    >
                      <ChevronDown className="h-3 w-3 text-white/60" />
                    </button>
                  </div>
                ))}
                {overlay.elements.length === 0 && (
                  <div className="text-white/40 text-center py-2">No elements</div>
                )}
              </div>
            </div>

            {selectedElement && (
              <div className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <span className="text-white/60">{elementIcons[selectedElement.type]}</span>
                    {elementLabels[selectedElement.type]}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                    onClick={() => deleteElement(selectedElement.id)}
                    data-testid="button-delete-element"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedElement.type !== "clock" &&
                    selectedElement.type !== "chatPreview" &&
                    selectedElement.type !== "logo" && (
                      <div>
                        <Label className="text-white/60 text-xs">Content</Label>
                        <Input
                          value={selectedElement.content}
                          onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                          className="bg-white/5 text-white/90 text-sm h-8 mt-1"
                          data-testid="input-element-content"
                        />
                      </div>
                    )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-white/60 text-xs">X</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 text-white/90 text-sm h-8 mt-1"
                        data-testid="input-element-x"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs">Y</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 text-white/90 text-sm h-8 mt-1"
                        data-testid="input-element-y"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-white/60 text-xs">Width</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 100 })}
                        className="bg-white/5 text-white/90 text-sm h-8 mt-1"
                        data-testid="input-element-width"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs">Height</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 50 })}
                        className="bg-white/5 text-white/90 text-sm h-8 mt-1"
                        data-testid="input-element-height"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60 text-xs">Font Size: {selectedElement.fontSize}px</Label>
                    <Slider
                      value={[selectedElement.fontSize]}
                      onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
                      min={10}
                      max={72}
                      step={1}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-white/60 text-xs">Text</Label>
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="h-8 w-full rounded cursor-pointer border-none mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs">BG</Label>
                      <input
                        type="color"
                        value={selectedElement.bgColor}
                        onChange={(e) => updateElement(selectedElement.id, { bgColor: e.target.value })}
                        className="h-8 w-full rounded cursor-pointer border-none mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60 text-xs">
                      Opacity: {Math.round(selectedElement.bgOpacity * 100)}%
                    </Label>
                    <Slider
                      value={[selectedElement.bgOpacity * 100]}
                      onValueChange={([v]) => updateElement(selectedElement.id, { bgOpacity: v / 100 })}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-white/60 text-xs">Align</Label>
                    <Select
                      value={selectedElement.textAlign}
                      onValueChange={(v) =>
                        updateElement(selectedElement.id, { textAlign: v as "left" | "center" | "right" })
                      }
                    >
                      <SelectTrigger className="bg-white/5 text-white/90 text-sm h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {savedOverlays.length > 0 && (
              <div className="glass rounded-xl p-3">
                <div className="text-sm font-medium text-white/90 mb-2">Saved</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {savedOverlays.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 hover:bg-white/10"
                    >
                      <button
                        className="text-xs text-white/80 hover:text-white truncate flex-1 text-left"
                        onClick={() => loadOverlayItem(o)}
                        data-testid={`button-load-overlay-${o.id}`}
                      >
                        {o.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                        onClick={() => deleteOverlay(o.id)}
                        data-testid={`button-delete-overlay-${o.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
