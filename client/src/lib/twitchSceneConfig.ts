export type SceneId = "opening" | "brb" | "ending";

export type Accent = "purple" | "cyan" | "pink" | "lime" | "amber" | "red";

export type SceneConfig = {
  channel: string;
  handle: string;
  nowPlaying: string;
  labelLeft: string;
  labelRight: string;
  accent: Accent;
  showTime: boolean;
};

export const defaultSceneConfig: SceneConfig = {
  channel: "Your Channel",
  handle: "@yourhandle",
  nowPlaying: "Lo-fi • chill set",
  labelLeft: "FOLLOW",
  labelRight: "SUBSCRIBE",
  accent: "purple",
  showTime: true,
};

export function encodeConfigToQuery(cfg: SceneConfig) {
  const sp = new URLSearchParams();
  sp.set("ch", cfg.channel);
  sp.set("h", cfg.handle);
  sp.set("np", cfg.nowPlaying);
  sp.set("l", cfg.labelLeft);
  sp.set("r", cfg.labelRight);
  sp.set("a", cfg.accent);
  sp.set("t", cfg.showTime ? "1" : "0");
  return sp.toString();
}

export function decodeConfigFromQuery(search: string): SceneConfig {
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const a = (sp.get("a") || defaultSceneConfig.accent) as Accent;
  const accent: Accent = ["purple", "cyan", "pink", "lime", "amber", "red"].includes(a)
    ? a
    : defaultSceneConfig.accent;

  const showTimeRaw = sp.get("t");
  const showTime = showTimeRaw === null ? defaultSceneConfig.showTime : showTimeRaw === "1";

  return {
    channel: sp.get("ch") || defaultSceneConfig.channel,
    handle: sp.get("h") || defaultSceneConfig.handle,
    nowPlaying: sp.get("np") || defaultSceneConfig.nowPlaying,
    labelLeft: sp.get("l") || defaultSceneConfig.labelLeft,
    labelRight: sp.get("r") || defaultSceneConfig.labelRight,
    accent,
    showTime,
  };
}
