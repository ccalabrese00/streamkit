import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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

function OverlayElementView({
  element,
  selected,
  onSelect,
  onDrag,
}: {
  element: OverlayElement;
  selected: boolean;
  onSelect: () => void;
  onDrag: (dx: number, dy: number) => void;
}) {
  const [time, setTime] = useState(new Date());
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false });

  useEffect(() => {
    if (element.type === "clock") {
      const interval = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [element.type]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, dragging: true };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      onDrag(dx, dy);
    };

    const handleMouseUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const renderContent = () => {
    switch (element.type) {
      case "clock":
        return formatTime(time);
      case "chatPreview":
        return (
          <div className="flex flex-col gap-1 p-2 text-xs">
            <div><span className="text-purple-400">viewer123:</span> let's goooo</div>
            <div><span className="text-cyan-400">streamer_fan:</span> hype!</div>
            <div><span className="text-pink-400">newbie_here:</span> first time watching</div>
          </div>
        );
      case "logo":
        return <div className="flex items-center justify-center h-full text-2xl">✦</div>;
      case "socials":
        return (
          <div className="flex flex-col gap-1 p-2">
            <div className="text-xs opacity-60">FOLLOW</div>
            <div>{element.content}</div>
          </div>
        );
      case "nowPlaying":
        return (
          <div className="flex items-center gap-2 p-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs opacity-60">NOW PLAYING</div>
              <div>{element.content}</div>
            </div>
          </div>
        );
      default:
        return element.content;
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-move rounded-lg overflow-hidden",
        selected && "ring-2 ring-white ring-offset-2 ring-offset-transparent"
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: `${element.bgColor}${Math.round(element.bgOpacity * 255).toString(16).padStart(2, "0")}`,
        color: element.color,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        textAlign: element.textAlign,
      }}
      onMouseDown={handleMouseDown}
      data-testid={`element-${element.id}`}
    >
      <div className="flex items-center justify-center h-full w-full p-2">
        {renderContent()}
      </div>
    </motion.div>
  );
}

export default function OverlayBuilder() {
  const [overlay, setOverlay] = useState<CustomOverlay>(createOverlay);
  const [savedOverlays, setSavedOverlays] = useState<CustomOverlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const selectedElement = overlay.elements.find((e) => e.id === selectedId);

  useEffect(() => {
    setSavedOverlays(loadOverlays());
  }, []);

  const addElement = useCallback((type: ElementType) => {
    const el = createElement(type, 50 + Math.random() * 100, 50 + Math.random() * 100);
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

  const loadOverlay = useCallback((o: CustomOverlay) => {
    setOverlay(o);
    setSelectedId(null);
    toast({ title: "Overlay loaded" });
  }, []);

  const deleteOverlay = useCallback((id: string) => {
    const newList = savedOverlays.filter((o) => o.id !== id);
    setSavedOverlays(newList);
    saveOverlays(newList);
    toast({ title: "Overlay deleted" });
  }, [savedOverlays]);

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
      toast({ title: "Overlay generated!", description: "AI created your overlay based on your prompt." });
    } catch (error) {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const obsUrl = `/overlay/view?d=${encodeOverlayToQuery(overlay)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <Input
                value={overlay.name}
                onChange={(e) => setOverlay((p) => ({ ...p, name: e.target.value }))}
                className="bg-white/5 text-white/90 text-lg font-semibold border-none"
                data-testid="input-overlay-name"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={saveCurrentOverlay} data-testid="button-save">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="secondary" className="gap-2" onClick={copyLink} data-testid="button-copy-link">
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy OBS Link"}
            </Button>
            <a href={obsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="gap-2" data-testid="button-preview">
                <ExternalLink className="h-4 w-4" />
                Preview
              </Button>
            </a>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(elementIcons) as ElementType[]).map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => addElement(type)}
                  data-testid={`button-add-${type}`}
                >
                  <Plus className="h-3 w-3" />
                  {elementIcons[type]}
                  {elementLabels[type]}
                </Button>
              ))}
            </div>

            <div
              className="relative aspect-video w-full rounded-xl border border-white/10 overflow-hidden"
              style={{ backgroundColor: overlay.bgColor }}
              onClick={() => setSelectedId(null)}
              data-testid="canvas-overlay"
            >
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
              {overlay.elements.map((el) => (
                <OverlayElementView
                  key={el.id}
                  element={el}
                  selected={selectedId === el.id}
                  onSelect={() => setSelectedId(el.id)}
                  onDrag={(dx, dy) => updateElement(el.id, { x: el.x + dx, y: el.y + dy })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
                <Wand2 className="h-4 w-4 text-purple-400" />
                AI Generator
              </div>
              <div className="grid gap-3">
                <Textarea
                  placeholder="Describe your overlay... e.g., 'cozy gaming stream with lo-fi vibes'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="bg-white/5 text-white/90 text-sm min-h-[60px]"
                  disabled={aiGenerating}
                  data-testid="input-ai-prompt"
                />
                <Button
                  variant="secondary"
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
                      Generate Overlay
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="text-sm font-semibold text-white/90 mb-3">Canvas</div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label className="text-white/70 text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={overlay.bgColor}
                      onChange={(e) => setOverlay((p) => ({ ...p, bgColor: e.target.value }))}
                      className="h-9 w-12 rounded border-none cursor-pointer"
                    />
                    <Input
                      value={overlay.bgColor}
                      onChange={(e) => setOverlay((p) => ({ ...p, bgColor: e.target.value }))}
                      className="bg-white/5 text-white/90 text-sm flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {selectedElement && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white/90">
                    {elementLabels[selectedElement.type]} Settings
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteElement(selectedElement.id)}
                    data-testid="button-delete-element"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3">
                  {selectedElement.type !== "clock" && selectedElement.type !== "chatPreview" && selectedElement.type !== "logo" && (
                    <div className="grid gap-2">
                      <Label className="text-white/70 text-xs">Content</Label>
                      <Input
                        value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="bg-white/5 text-white/90 text-sm"
                        data-testid="input-element-content"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label className="text-white/70 text-xs">Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 100 })}
                        className="bg-white/5 text-white/90 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-white/70 text-xs">Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 50 })}
                        className="bg-white/5 text-white/90 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/70 text-xs">Font Size: {selectedElement.fontSize}px</Label>
                    <Slider
                      value={[selectedElement.fontSize]}
                      onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
                      min={10}
                      max={72}
                      step={1}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label className="text-white/70 text-xs">Text Color</Label>
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="h-9 w-full rounded border-none cursor-pointer"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-white/70 text-xs">BG Color</Label>
                      <input
                        type="color"
                        value={selectedElement.bgColor}
                        onChange={(e) => updateElement(selectedElement.id, { bgColor: e.target.value })}
                        className="h-9 w-full rounded border-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/70 text-xs">BG Opacity: {Math.round(selectedElement.bgOpacity * 100)}%</Label>
                    <Slider
                      value={[selectedElement.bgOpacity * 100]}
                      onValueChange={([v]) => updateElement(selectedElement.id, { bgOpacity: v / 100 })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white/70 text-xs">Text Align</Label>
                    <Select
                      value={selectedElement.textAlign}
                      onValueChange={(v) => updateElement(selectedElement.id, { textAlign: v as "left" | "center" | "right" })}
                    >
                      <SelectTrigger className="bg-white/5 text-white/90 text-sm">
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
              <div className="glass rounded-2xl p-4">
                <div className="text-sm font-semibold text-white/90 mb-3">Saved Overlays</div>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {savedOverlays.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <button
                        className="text-sm text-white/80 hover:text-white truncate flex-1 text-left"
                        onClick={() => loadOverlay(o)}
                      >
                        {o.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                        onClick={() => deleteOverlay(o.id)}
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
