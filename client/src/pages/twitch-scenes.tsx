import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Monitor, Play, Square, Sparkles } from "lucide-react";

const scenes = [
  {
    id: "opening" as const,
    label: "Starting Soon",
    title: "Starting Soon",
    subtitle: "Grab a drink — we’re going live in a moment.",
    accent: "purple" as const,
  },
  {
    id: "brb" as const,
    label: "Be Right Back",
    title: "Be Right Back",
    subtitle: "Quick break. Don’t go anywhere.",
    accent: "cyan" as const,
  },
  {
    id: "ending" as const,
    label: "Stream Ending",
    title: "See You Soon",
    subtitle: "Thanks for hanging out — catch you next time.",
    accent: "pink" as const,
  },
];

type SceneId = (typeof scenes)[number]["id"];

function useNowTime() {
  const [t, setT] = useState(() => new Date());
  useState(() => {
    const i = window.setInterval(() => setT(new Date()), 1000);
    return () => window.clearInterval(i);
  });
  return t;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SceneCanvas({ sceneId }: { sceneId: SceneId }) {
  const scene = scenes.find((s) => s.id === sceneId)!;
  const time = useNowTime();

  const tickerText = useMemo(() => {
    const base = [
      "FOLLOW •",
      "SUBSCRIBE •",
      "CHAT: !discord •",
      "NEW VODS •",
      "THANKS FOR SUPPORT •",
      "BE KIND •",
    ].join(" ");
    return `${base} ${base} ${base}`;
  }, []);

  return (
    <div
      className={cn(
        "relative h-[min(72vh,720px)] w-full overflow-hidden rounded-3xl border border-white/10",
        "scene-grid"
      )}
      data-testid="canvas-scene"
    >
      <div className="pointer-events-none absolute inset-0 scene-vignette" />
      <div className="pointer-events-none absolute inset-0 noise" />
      <div className="pointer-events-none absolute inset-0 scanline" />

      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{
          x: [0, 28, 0],
          y: [0, 18, 0],
          opacity: [0.55, 0.7, 0.55],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-28 -top-16 h-[460px] w-[460px] rounded-full bg-cyan-400/18 blur-3xl"
        animate={{
          x: [0, -26, 0],
          y: [0, 22, 0],
          opacity: [0.45, 0.6, 0.45],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/3 top-[58%] h-[520px] w-[520px] rounded-full bg-pink-500/12 blur-3xl"
        animate={{
          x: [0, 18, 0],
          y: [0, -20, 0],
          opacity: [0.35, 0.48, 0.35],
        }}
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
                Your Channel
              </div>
              <div
                className="font-mono text-xs text-white/60"
                data-testid="text-time"
              >
                {formatTime(time)}
              </div>
            </div>
          </div>

          <div
            className="scene-badge rounded-full px-4 py-2"
            data-testid="pill-scene"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  scene.accent === "purple"
                    ? "bg-violet-400"
                    : scene.accent === "cyan"
                      ? "bg-cyan-300"
                      : "bg-pink-300"
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
                <span className="font-mono text-xs text-white/60">Lo-fi • chill set</span>
              </div>

              <div
                className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-3"
                data-testid="card-social"
              >
                <span className="text-sm font-medium text-white/85">@yourhandle</span>
                <span className="font-mono text-xs text-white/60">• socials in chat</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div
              className="glass floaty rounded-3xl p-5"
              data-testid="panel-chat"
            >
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

            <div
              className="glass floaty-2 rounded-3xl p-5"
              data-testid="panel-stats"
            >
              <div className="text-sm font-semibold tracking-tight text-white/90">Stream Stats</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {
                  [
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
                  ))
                }
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
  const [sceneId, setSceneId] = useState<SceneId>("opening");
  const [playing, setPlaying] = useState(true);

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
              Pick a scene and use it as a full-screen overlay in OBS. Everything animates: glow, floating panels, and the ticker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={playing ? "default" : "secondary"}
              onClick={() => setPlaying(true)}
              className="gap-2"
              data-testid="button-play"
            >
              <Play className="h-4 w-4" />
              Play
            </Button>
            <Button
              variant={!playing ? "default" : "secondary"}
              onClick={() => setPlaying(false)}
              className="gap-2"
              data-testid="button-pause"
            >
              <Square className="h-4 w-4" />
              Pause
            </Button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[360px_1fr]">
          <div className="glass rounded-3xl p-4">
            <div
              className="text-sm font-semibold tracking-tight text-white/90"
              data-testid="text-scenes-title"
            >
              Scenes
            </div>
            <div className="mt-4 grid gap-2">
              {scenes.map((s) => {
                const active = s.id === sceneId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSceneId(s.id)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                      "border border-white/10 bg-white/5 hover:bg-white/7",
                      active && "bg-white/10"
                    )}
                    data-testid={`button-scene-${s.id}`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white/90">{s.label}</div>
                      <div className="mt-0.5 font-mono text-xs text-white/55">
                        1920×1080 • loop
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        s.accent === "purple"
                          ? "bg-violet-400"
                          : s.accent === "cyan"
                            ? "bg-cyan-300"
                            : "bg-pink-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs font-medium text-white/75" data-testid="text-tip-title">
                Tip
              </div>
              <div
                className="mt-2 text-sm text-white/65"
                data-testid="text-tip"
              >
                In OBS: add a Browser Source → set Width 1920, Height 1080 → use the full-screen preview.
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div
                className="text-sm font-semibold text-white/90"
                data-testid="text-preview-title"
              >
                Preview
              </div>
              <a
                href={`/scene/${sceneId}`}
                className="text-sm font-medium text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
                data-testid="link-fullscreen"
              >
                Open full-screen
              </a>
            </div>

            <div className={cn("mt-3", !playing && "[&_*]:!animate-none")}
              data-testid="wrap-preview"
            >
              <SceneCanvas sceneId={sceneId} />
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-white/45" data-testid="text-footer">
          Want a custom theme (colors, your logo, webcam frame, alerts)? Tell me your vibe and I’ll style it.
        </div>
      </div>
    </div>
  );
}
