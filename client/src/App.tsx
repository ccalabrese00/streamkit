import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TwitchScenes from "@/pages/twitch-scenes.tsx";
import TwitchSceneFullscreen from "@/pages/twitch-scene-fullscreen.tsx";
import OverlayBuilder from "@/pages/overlay-builder.tsx";
import OverlayView from "@/pages/overlay-view.tsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TwitchScenes} />
      <Route path="/scene/:id" component={TwitchSceneFullscreen} />
      <Route path="/overlay/builder" component={OverlayBuilder} />
      <Route path="/overlay/view" component={OverlayView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
