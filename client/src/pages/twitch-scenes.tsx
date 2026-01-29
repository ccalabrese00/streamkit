import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Monitor,
  Play,
  Square,
  Sparkles,
  Copy,
  ExternalLink,
  BookmarkPlus,
  Trash2,
  Pencil,
  Check,
  Wand2,
  Loader2,
  Layers,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import {
  defaultSceneConfig,
  encodeConfigToQuery,
  type Accent,
  type SceneConfig,
} from "@/lib/twitchSceneConfig";
import { loadPresets, makeId, savePresets, type ScenePreset } from "@/lib/twitchPresets";

interface SceneType {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  accent: Accent;
  isCustom?: boolean;
}

const defaultScenes: SceneType[] = [
  {
    id: "opening",
    label: "Starting Soon",
    title: "Starting Soon",
    subtitle: "Grab a drink — we’re going live in a moment.",
    accent: "purple",
  },
  {
    id: "brb",
    label: "Be Right Back",
    title: "Be Right Back",
    subtitle: "Quick break. Don’t go anywhere.",
    accent: "cyan",
  },
  {
    id: "ending",
    label: "Stream Ending",
    title: "See You Soon",
    subtitle: "Thanks for hanging out — catch you next time.",
    accent: "pink",
  },
];

const CUSTOM_SCENES_KEY = "twitch_custom_scenes";

function loadCustomScenes(): SceneType[] {
  try {
    const data = localStorage.getItem(CUSTOM_SCENES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCustomScenes(list: SceneType[]): void {
  localStorage.setItem(CUSTOM_SCENES_KEY, JSON.stringify(list));
}

function useNowTime() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = window.setInterval(() => setT(new Date()), 1000);
    return () => window.clearInterval(i);
  }, []);
  return t;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function accentDotClass(accent: Accent) {
  switch (accent) {
    case "cyan":
      return "bg-cyan-300";
    case "pink":
      return "bg-pink-300";
    case "lime":
      return "bg-lime-300";
    case "amber":
      return "bg-amber-300";
    case "red":
      return "bg-red-300";
    case "purple":
    default:
      return "bg-violet-400";
  }
}

function buildSceneUrl(sceneId: string, cfg: SceneConfig) {
  const qs = encodeConfigToQuery(cfg);
  return `/scene/${sceneId}?${qs}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function SceneCanvas({ sceneId, cfg, allScenes }: { sceneId: string; cfg: SceneConfig; allScenes: SceneType[] }) {
  const scene = allScenes.find((s) => s.id === sceneId) || allScenes[0];
  const time = useNowTime();

  const tickerText = useMemo(() => {
    const base = [
      `${cfg.labelLeft} •`,
      `${cfg.labelRight} •`,
      "CHAT: !discord •",
      "NEW VODS •",
      "THANKS FOR SUPPORT •",
      "BE KIND •",
    ].join(" ");
    return `${base} ${base} ${base}`;
  }, [cfg.labelLeft, cfg.labelRight]);

  return (
    <div
      className={cn(
        "relative aspect-video w-full max-h-[280px] overflow-hidden rounded-xl border border-white/10",
        "scene-grid text-[8px]"
      )}
      data-testid="canvas-scene"
    >
      <div className="pointer-events-none absolute inset-0 scene-vignette" />
      <div className="pointer-events-none absolute inset-0 noise" />
      <div className="pointer-events-none absolute inset-0 scanline" />

      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ x: [0, 28, 0], y: [0, 18, 0], opacity: [0.55, 0.7, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-28 -top-16 h-[460px] w-[460px] rounded-full bg-cyan-400/18 blur-3xl"
        animate={{ x: [0, -26, 0], y: [0, 22, 0], opacity: [0.45, 0.6, 0.45] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/3 top-[58%] h-[520px] w-[520px] rounded-full bg-pink-500/12 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -20, 0], opacity: [0.35, 0.48, 0.35] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative scene-safe flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-10 w-10 place-items-center rounded-2xl border border-white/14 bg-white/6 shadow-[0_18px_60px_rgba(0,0,0,0.5)]",
                "pulse-glow"
              )}
              data-testid="badge-live"
            >
              <Sparkles className="h-5 w-5 text-white/90" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div
                className="text-sm font-medium tracking-tight text-white/90"
                data-testid="text-channel"
              >
                {cfg.channel}
              </div>
              {cfg.showTime ? (
                <div className="font-mono text-xs text-white/60" data-testid="text-time">
                  {formatTime(time)}
                </div>
              ) : (
                <div className="font-mono text-xs text-white/60" data-testid="text-time">
                  
                </div>
              )}
            </div>
          </div>

          <div className="scene-badge rounded-full px-4 py-2" data-testid="pill-scene">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  accentDotClass(cfg.accent)
                )}
              />
              <span className="text-xs font-medium tracking-wide text-white/80">
                {scene.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.2fr_.8fr] md:items-end">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(12px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1
                  className={cn(
                    "scene-title text-balance text-5xl font-semibold leading-[0.95] md:text-7xl",
                    "text-white"
                  )}
                  data-testid="text-scene-title"
                >
                  {scene.title}
                </h1>
                <p
                  className="mt-5 max-w-[44ch] text-pretty text-base text-white/70 md:text-lg"
                  data-testid="text-scene-subtitle"
                >
                  {scene.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div
                className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-3"
                data-testid="card-nowplaying"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400/90" />
                <span className="text-sm font-medium text-white/85">Now Playing</span>
                <span className="mx-2 h-4 w-px bg-white/12" />
                <span className="font-mono text-xs text-white/60">{cfg.nowPlaying}</span>
              </div>

              {Object.entries(cfg.socials).filter(([_, v]) => v).length > 0 && (
                <div
                  className="glass inline-flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3"
                  data-testid="card-social"
                >
                  {cfg.socials.twitch && <span className="font-mono text-xs text-white/70">twitch.tv/{cfg.socials.twitch}</span>}
                  {cfg.socials.youtube && <span className="font-mono text-xs text-white/70">@{cfg.socials.youtube}</span>}
                  {cfg.socials.instagram && <span className="font-mono text-xs text-white/70">@{cfg.socials.instagram}</span>}
                  {cfg.socials.x && <span className="font-mono text-xs text-white/70">@{cfg.socials.x}</span>}
                  {cfg.socials.tiktok && <span className="font-mono text-xs text-white/70">@{cfg.socials.tiktok}</span>}
                  {cfg.socials.discord && <span className="font-mono text-xs text-white/70">{cfg.socials.discord}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="glass floaty rounded-3xl p-5" data-testid="panel-chat">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-tight text-white/90">Chat</div>
                <div className="font-mono text-xs text-white/55">LIVE</div>
              </div>
              <div className="mt-4 grid gap-3">
                {["welcome in!", "hydrate check", "let’s goooo", "new emotes soon"].map(
                  (m, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3"
                      data-testid={`row-chat-${idx}`}
                    >
                      <div className="h-8 w-8 shrink-0 rounded-xl bg-white/8" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white/80">user{idx + 1}</div>
                        <div className="text-sm text-white/65">{m}</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="glass floaty-2 rounded-3xl p-5" data-testid="panel-stats">
              <div className="text-sm font-semibold tracking-tight text-white/90">Stream Stats</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { k: "Viewers", v: "128" },
                  { k: "Subs", v: "12" },
                  { k: "Hype", v: "99" },
                ].map((s, i) => (
                  <div
                    key={s.k}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                    data-testid={`card-stat-${i}`}
                  >
                    <div className="font-mono text-[11px] text-white/55">{s.k}</div>
                    <div className="mt-1 text-lg font-semibold text-white/90">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative -mx-8 mt-10 overflow-hidden md:-mx-16">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/40 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent" />
          <div className="flex w-[200%] gap-10 py-3">
            <div className="ticker flex w-1/2 items-center gap-10" data-testid="ticker-left">
              {tickerText.split(" ").map((w, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[11px] tracking-[0.28em] text-white/55"
                >
                  {w}
                </span>
              ))}
            </div>
            <div className="ticker flex w-1/2 items-center gap-10" data-testid="ticker-right">
              {tickerText.split(" ").map((w, idx) => (
                <span
                  key={`r-${idx}`}
                  className="font-mono text-[11px] tracking-[0.28em] text-white/55"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}

export default function TwitchScenes() {
  const [sceneId, setSceneId] = useState<string>("opening");
  const [customScenes, setCustomScenes] = useState<SceneType[]>([]);
  const allScenes = [...defaultScenes, ...customScenes];
  const [playing, setPlaying] = useState(true);
  const [cfg, setCfg] = useState<SceneConfig>(defaultSceneConfig);
  const [copied, setCopied] = useState(false);

  const [presets, setPresets] = useState<ScenePreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiJustGenerated, setAiJustGenerated] = useState(false);

  useEffect(() => {
    setPresets(loadPresets());
    setCustomScenes(loadCustomScenes());
  }, []);

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  useEffect(() => {
    saveCustomScenes(customScenes);
  }, [customScenes]);

  function addCustomScene() {
    const newScene: SceneType = {
      id: `custom-${Date.now()}`,
      label: "New Scene",
      title: "Custom Scene",
      subtitle: "Your message here",
      accent: cfg.accent,
      isCustom: true,
    };
    setCustomScenes((prev) => [...prev, newScene]);
    setSceneId(newScene.id);
    toast({ title: "Scene added" });
  }

  function deleteCustomScene(id: string) {
    setCustomScenes((prev) => prev.filter((s) => s.id !== id));
    if (sceneId === id) {
      setSceneId("opening");
    }
    toast({ title: "Scene deleted" });
  }

  function updateCustomScene(id: string, updates: Partial<SceneType>) {
    setCustomScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  const sceneUrl = buildSceneUrl(sceneId, cfg);

  function applyPreset(p: ScenePreset) {
    setCfg(p.config);
    toast({ title: "Preset loaded", description: p.name });
  }

  function saveNewPreset() {
    const name = presetName.trim() || "Untitled";
    const now = Date.now();
    const p: ScenePreset = {
      id: makeId(),
      name,
      config: cfg,
      createdAt: now,
      updatedAt: now,
    };
    setPresets((prev) => [p, ...prev]);
    setPresetName("");
    toast({ title: "Preset saved" });
  }

  function updatePresetName(id: string, name: string) {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p))
    );
  }

  function overwritePresetConfig(id: string) {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, config: cfg, updatedAt: Date.now() } : p))
    );
    toast({ title: "Preset updated" });
  }

  function deletePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Preset deleted" });
  }

  async function generateAIScene() {
    if (!aiPrompt.trim() || aiGenerating) return;

    setAiGenerating(true);
    try {
      const response = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate scene");
      }

      const newConfig: SceneConfig = await response.json();
      setCfg(newConfig);
      setAiPrompt("");
      setAiJustGenerated(true);
      setTimeout(() => setAiJustGenerated(false), 10000);
      toast({
        title: "Scene generated!",
        description: "Check the preview — AI created a new scene based on your prompt.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate scene. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75"
              data-testid="pill-app"
            >
              <Monitor className="h-4 w-4" />
              Twitch Scenes
            </div>
            <h2
              className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl"
              data-testid="text-heading"
            >
              Animated scenes for your stream
            </h2>
            <p
              className="mt-3 max-w-[66ch] text-pretty text-sm text-white/65 md:text-base"
              data-testid="text-description"
            >
              Customize your channel name, handle, ticker words, and accent color — then save presets and copy an OBS-ready link.
            </p>
            <Link href="/overlay/builder">
              <Button variant="secondary" className="mt-4 gap-2" data-testid="button-overlay-builder">
                <Layers className="h-4 w-4" />
                Custom Overlay Builder
              </Button>
            </Link>
          </div>

          </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <div
                  className="text-sm font-semibold tracking-tight text-white/90"
                  data-testid="text-scenes-title"
                >
                  Scenes
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={addCustomScene}
                  data-testid="button-add-scene"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 grid gap-2">
                {allScenes.map((s) => {
                  const active = s.id === sceneId;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-2xl px-4 py-3 transition",
                        "border border-white/10 bg-white/5 hover:bg-white/7",
                        active && "bg-white/10"
                      )}
                    >
                      <button
                        onClick={() => setSceneId(s.id)}
                        className="flex-1 text-left"
                        data-testid={`button-scene-${s.id}`}
                      >
                        <div className="text-sm font-semibold text-white/90">{s.label}</div>
                        <div className="mt-0.5 font-mono text-xs text-white/55">1920×1080</div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", accentDotClass(s.accent))} />
                        {s.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomScene(s.id);
                            }}
                            data-testid={`button-delete-scene-${s.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-medium text-white/75" data-testid="text-tip-title">
                  Tip
                </div>
                <div className="mt-2 text-sm text-white/65" data-testid="text-tip">
                  In OBS: add a Browser Source → set Width 1920, Height 1080 → paste the link below.
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-4 lg:col-span-2 max-h-[500px] overflow-y-auto" data-testid="panel-customize">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-sm font-semibold tracking-tight text-white/90"
                  data-testid="text-customize-title"
                >
                  Customize
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCfg(defaultSceneConfig)}
                  data-testid="button-reset"
                >
                  Reset
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label className="text-white/70 text-xs" htmlFor="channel" data-testid="label-channel">
                    Channel name
                  </Label>
                  <Input
                    id="channel"
                    value={cfg.channel}
                    onChange={(e) => setCfg((p) => ({ ...p, channel: e.target.value }))}
                    className="bg-white/5 text-white/90 h-8 text-sm"
                    data-testid="input-channel"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-white/70 text-xs" data-testid="label-socials">
                    Social handles
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Input
                      placeholder="Twitch"
                      value={cfg.socials.twitch}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, twitch: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-twitch"
                    />
                    <Input
                      placeholder="YouTube"
                      value={cfg.socials.youtube}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, youtube: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-youtube"
                    />
                    <Input
                      placeholder="Instagram"
                      value={cfg.socials.instagram}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-instagram"
                    />
                    <Input
                      placeholder="X"
                      value={cfg.socials.x}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, x: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-x"
                    />
                    <Input
                      placeholder="TikTok"
                      value={cfg.socials.tiktok}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, tiktok: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-tiktok"
                    />
                    <Input
                      placeholder="Discord"
                      value={cfg.socials.discord}
                      onChange={(e) => setCfg((p) => ({ ...p, socials: { ...p.socials, discord: e.target.value } }))}
                      className="bg-white/5 text-white/90 text-xs h-8"
                      data-testid="input-discord"
                    />
                  </div>
                </div>

                <div className="grid gap-1">
                  <Label className="text-white/70 text-xs" htmlFor="nowPlaying" data-testid="label-nowplaying">
                    Now playing
                  </Label>
                  <Input
                    id="nowPlaying"
                    value={cfg.nowPlaying}
                    onChange={(e) => setCfg((p) => ({ ...p, nowPlaying: e.target.value }))}
                    className="bg-white/5 text-white/90 h-8 text-sm"
                    data-testid="input-nowplaying"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-white/70 text-xs" htmlFor="labelLeft" data-testid="label-ticker-left">
                      Ticker 1
                    </Label>
                    <Input
                      id="labelLeft"
                      value={cfg.labelLeft}
                      onChange={(e) => setCfg((p) => ({ ...p, labelLeft: e.target.value }))}
                      className="bg-white/5 text-white/90 h-8 text-sm"
                      data-testid="input-ticker-left"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-white/70 text-xs" htmlFor="labelRight" data-testid="label-ticker-right">
                      Ticker 2
                    </Label>
                    <Input
                      id="labelRight"
                      value={cfg.labelRight}
                      onChange={(e) => setCfg((p) => ({ ...p, labelRight: e.target.value }))}
                      className="bg-white/5 text-white/90 h-8 text-sm"
                      data-testid="input-ticker-right"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-white/70 text-xs" data-testid="label-accent">Accent</Label>
                    <Select
                      value={cfg.accent}
                      onValueChange={(v) => setCfg((p) => ({ ...p, accent: v as Accent }))}
                    >
                      <SelectTrigger className="bg-white/5 text-white/90 h-8 text-sm" data-testid="select-accent">
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent data-testid="select-accent-content">
                        <SelectItem value="purple" data-testid="option-accent-purple">Purple</SelectItem>
                        <SelectItem value="cyan" data-testid="option-accent-cyan">Cyan</SelectItem>
                        <SelectItem value="pink" data-testid="option-accent-pink">Pink</SelectItem>
                        <SelectItem value="lime" data-testid="option-accent-lime">Lime</SelectItem>
                        <SelectItem value="amber" data-testid="option-accent-amber">Amber</SelectItem>
                        <SelectItem value="red" data-testid="option-accent-red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Switch
                    checked={cfg.showTime}
                    onCheckedChange={(v) => setCfg((p) => ({ ...p, showTime: v }))}
                    data-testid="switch-showtime"
                  />
                  <div className="text-xs text-white/70" data-testid="text-toggle-time-title">
                    Show clock
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs font-medium text-white/75" data-testid="text-link-title">
                    OBS link
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <div
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[12px] text-white/75"
                      data-testid="text-obs-link"
                    >
                      {sceneUrl}
                    </div>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={async () => {
                        await copyText(window.location.origin + sceneUrl);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1200);
                      }}
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={sceneUrl}
                      className="inline-flex items-center gap-2 text-sm font-medium text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
                      data-testid="link-open-fullscreen"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open full-screen
                    </a>
                    <div className="text-xs text-white/45" data-testid="text-link-hint">
                      Anyone with this link gets your settings.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-4" data-testid="panel-presets">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold tracking-tight text-white/90" data-testid="text-presets-title">
                  Presets
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="h-9 bg-white/5 text-white/90"
                    data-testid="input-preset-name"
                  />
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={saveNewPreset}
                    data-testid="button-save-preset"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>

              {presets.length === 0 ? (
                <div
                  className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65"
                  data-testid="text-presets-empty"
                >
                  No presets yet. Create one to quickly switch between different looks.
                </div>
              ) : (
                <div className="mt-4 grid gap-2" data-testid="list-presets">
                  {presets.map((p) => {
                    const isEditing = editingId === p.id;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                        data-testid={`row-preset-${p.id}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2.5 w-2.5 shrink-0 rounded-full",
                                accentDotClass(p.config.accent)
                              )}
                            />
                            {isEditing ? (
                              <Input
                                value={p.name}
                                onChange={(e) => updatePresetName(p.id, e.target.value)}
                                className="h-8 bg-white/0 text-white/90"
                                data-testid={`input-preset-rename-${p.id}`}
                              />
                            ) : (
                              <div
                                className="truncate text-sm font-semibold text-white/90"
                                data-testid={`text-preset-name-${p.id}`}
                              >
                                {p.name}
                              </div>
                            )}
                          </div>
                          <div
                            className="mt-1 truncate font-mono text-[11px] tracking-[0.18em] text-white/55"
                            data-testid={`text-preset-meta-${p.id}`}
                          >
                            {p.config.channel} • {p.config.socials?.twitch || p.config.socials?.instagram || p.config.socials?.youtube || "no socials"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            className="h-9 px-3"
                            onClick={() => applyPreset(p)}
                            data-testid={`button-preset-load-${p.id}`}
                          >
                            Load
                          </Button>

                          <Button
                            variant="secondary"
                            className="h-9 px-3"
                            onClick={() => overwritePresetConfig(p.id)}
                            data-testid={`button-preset-overwrite-${p.id}`}
                          >
                            Update
                          </Button>

                          <Button
                            variant="secondary"
                            className="h-9 w-9 p-0"
                            onClick={() => {
                              if (isEditing) {
                                setEditingId(null);
                                toast({ title: "Preset renamed" });
                              } else {
                                setEditingId(p.id);
                              }
                            }}
                            data-testid={`button-preset-rename-${p.id}`}
                            aria-label={isEditing ? "Done" : "Rename"}
                          >
                            {isEditing ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="secondary"
                            className="h-9 w-9 p-0"
                            onClick={() => deletePreset(p.id)}
                            data-testid={`button-preset-delete-${p.id}`}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-3 md:col-span-2 lg:col-span-3" data-testid="panel-ai-generator">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white/70 whitespace-nowrap">
                  <Wand2 className="h-4 w-4" />
                  AI
                </div>
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !aiGenerating) {
                      generateAIScene();
                    }
                  }}
                  placeholder="Describe a vibe... cyberpunk, cozy cafe, retro arcade"
                  className="bg-white/5 text-white/90 text-sm flex-1"
                  disabled={aiGenerating}
                  data-testid="input-ai-prompt"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={generateAIScene}
                  disabled={!aiPrompt.trim() || aiGenerating}
                  data-testid="button-ai-generate"
                >
                  {aiGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white/90" data-testid="text-preview-title">
                Preview
              </div>
              {aiJustGenerated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300"
                >
                  AI Generated!
                </motion.div>
              )}
            </div>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant={playing ? "default" : "secondary"}
                size="sm"
                onClick={() => setPlaying(true)}
                className="gap-1.5"
                data-testid="button-play"
              >
                <Play className="h-3.5 w-3.5" />
                Play
              </Button>
              <Button
                variant={!playing ? "default" : "secondary"}
                size="sm"
                onClick={() => setPlaying(false)}
                className="gap-1.5"
                data-testid="button-pause"
              >
                <Square className="h-3.5 w-3.5" />
                Pause
              </Button>
            </div>
            <div
              className={cn(
                "transition-all duration-500",
                !playing && "[&_*]:!animate-none",
                aiJustGenerated && "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background rounded-3xl"
              )}
              data-testid="wrap-preview"
            >
              <SceneCanvas sceneId={sceneId} cfg={cfg} allScenes={allScenes} />
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-white/45" data-testid="text-footer">
          Publish this project and share the link — anyone can customize their own OBS URL.
        </div>
      </div>
    </div>
  );
}
