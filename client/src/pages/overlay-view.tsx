import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { decodeOverlayFromQuery, type OverlayElement, type CustomOverlay } from "@/lib/overlayConfig";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function OverlayElementRender({ element }: { element: OverlayElement }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (element.type === "clock") {
      const interval = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [element.type]);

  const renderContent = () => {
    switch (element.type) {
      case "clock":
        return formatTime(time);
      case "chatPreview":
        return (
          <div className="flex flex-col gap-2 p-3 text-sm">
            <div><span style={{ color: "#a78bfa" }}>viewer123:</span> let's goooo</div>
            <div><span style={{ color: "#22d3ee" }}>streamer_fan:</span> hype!</div>
            <div><span style={{ color: "#f472b6" }}>newbie_here:</span> first time watching</div>
            <div><span style={{ color: "#4ade80" }}>long_time_sub:</span> been here since day 1</div>
          </div>
        );
      case "logo":
        return <div className="flex items-center justify-center h-full text-4xl">✦</div>;
      case "socials":
        return (
          <div className="flex flex-col gap-1 p-3">
            <div className="text-sm opacity-60 tracking-wider">FOLLOW</div>
            <div>{element.content}</div>
          </div>
        );
      case "nowPlaying":
        return (
          <div className="flex items-center gap-3 p-3">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm opacity-60 tracking-wider">NOW PLAYING</div>
              <div>{element.content}</div>
            </div>
          </div>
        );
      default:
        return element.content;
    }
  };

  return (
    <div
      className="absolute rounded-lg overflow-hidden"
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
    >
      <div className="flex items-center justify-center h-full w-full">
        {renderContent()}
      </div>
    </div>
  );
}

export default function OverlayView() {
  const [location] = useLocation();
  const [overlay, setOverlay] = useState<CustomOverlay | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const data = params.get("d");
    if (data) {
      const decoded = decodeOverlayFromQuery(data);
      setOverlay(decoded);
    }
  }, [location]);

  if (!overlay) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50">
        No overlay data found
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0"
      style={{ backgroundColor: overlay.bgColor }}
    >
      {overlay.elements.map((el) => (
        <OverlayElementRender key={el.id} element={el} />
      ))}
    </div>
  );
}
