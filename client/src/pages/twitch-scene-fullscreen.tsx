import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const scenes = {
  opening: {
    label: "STARTING SOON",
    title: "Starting Soon",
    subtitle: "Grab a drink — we’re going live in a moment.",
    accent: "purple" as const,
  },
  brb: {
    label: "BE RIGHT BACK",
    title: "Be Right Back",
    subtitle: "Quick break. Don’t go anywhere.",
    accent: "cyan" as const,
  },
  ending: {
    label: "STREAM ENDING",
    title: "See You Soon",
    subtitle: "Thanks for hanging out — catch you next time.",
    accent: "pink" as const,
  },
};

type SceneKey = keyof typeof scenes;

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TwitchSceneFullscreen() {
  const [location] = useLocation();
  const sceneKey = (location.split("/")[2] || "opening") as SceneKey;
  const scene = scenes[sceneKey] ?? scenes.opening;

  const t = new Date();

  return (
    <div
      className={cn("fixed inset-0", "scene-grid")}
      data-testid="fullscreen-scene"
    >
      <div className="pointer-events-none absolute inset-0 scene-vignette" />
      <div className="pointer-events-none absolute inset-0 noise" />
      <div className="pointer-events-none absolute inset-0 scanline" />

      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ x: [0, 28, 0], y: [0, 18, 0], opacity: [0.55, 0.7, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-28 -top-16 h-[580px] w-[580px] rounded-full bg-cyan-400/18 blur-3xl"
        animate={{ x: [0, -26, 0], y: [0, 22, 0], opacity: [0.45, 0.6, 0.45] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/3 top-[58%] h-[640px] w-[640px] rounded-full bg-pink-500/12 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -20, 0], opacity: [0.35, 0.48, 0.35] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative h-full w-full scene-safe">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-2xl border border-white/14 bg-white/6",
                "pulse-glow"
              )}
              data-testid="badge-fullscreen"
            >
              <Sparkles className="h-6 w-6 text-white/90" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-white/90" data-testid="text-channel-full">
                Your Channel
              </div>
              <div className="font-mono text-xs text-white/60" data-testid="text-time-full">
                {formatTime(t)}
              </div>
            </div>
          </div>

          <div className="scene-badge rounded-full px-5 py-2.5" data-testid="pill-scene-full">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  scene.accent === "purple"
                    ? "bg-violet-400"
                    : scene.accent === "cyan"
                      ? "bg-cyan-300"
                      : "bg-pink-300"
                )}
              />
              <span className="text-xs font-semibold tracking-[0.22em] text-white/80">
                {scene.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-[10vh] max-w-[980px]">
          <h1
            className="scene-title text-balance text-[84px] font-semibold leading-[0.9] text-white"
            data-testid="text-title-full"
          >
            {scene.title}
          </h1>
          <p
            className="mt-6 max-w-[56ch] text-pretty text-xl text-white/70"
            data-testid="text-subtitle-full"
          >
            {scene.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="glass floaty rounded-3xl px-6 py-5" data-testid="card-full-1">
              <div className="font-mono text-xs tracking-[0.22em] text-white/55">NEXT UP</div>
              <div className="mt-2 text-lg font-semibold text-white/90">Co-op + Q&A</div>
            </div>
            <div className="glass floaty-2 rounded-3xl px-6 py-5" data-testid="card-full-2">
              <div className="font-mono text-xs tracking-[0.22em] text-white/55">COMMANDS</div>
              <div className="mt-2 text-lg font-semibold text-white/90">!discord • !music • !setup</div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 -mx-8 overflow-hidden md:-mx-16">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-black/45 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-black/45 to-transparent" />
          <div className="flex w-[200%] gap-10 py-4">
            <div className="ticker flex w-1/2 items-center gap-12" data-testid="ticker-full-left">
              {Array.from({ length: 40 }).map((_, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[12px] tracking-[0.34em] text-white/55"
                >
                  FOLLOW • SUBSCRIBE • THANKS FOR SUPPORT •
                </span>
              ))}
            </div>
            <div className="ticker flex w-1/2 items-center gap-12" data-testid="ticker-full-right">
              {Array.from({ length: 40 }).map((_, idx) => (
                <span
                  key={`r-${idx}`}
                  className="font-mono text-[12px] tracking-[0.34em] text-white/55"
                >
                  FOLLOW • SUBSCRIBE • THANKS FOR SUPPORT •
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
