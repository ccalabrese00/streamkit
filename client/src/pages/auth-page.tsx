import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Monitor } from "lucide-react";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      setFormError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    if (tab === "signup") {
      if (!/[A-Z]/.test(password)) {
        setFormError("Password must include an uppercase letter");
        return;
      }
      if (!/[a-z]/.test(password)) {
        setFormError("Password must include a lowercase letter");
        return;
      }
      if (!/[0-9]/.test(password)) {
        setFormError("Password must include a number");
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        setFormError("Password must include a special character");
        return;
      }
    }

    if (tab === "signup") {
      if (!trimmedUsername) {
        setFormError("Username is required");
        return;
      }
      if (trimmedUsername.length < 3) {
        setFormError("Username must be at least 3 characters");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setFormError("Username can only contain letters, numbers, and underscores");
        return;
      }
    }

    try {
      if (tab === "login") {
        await login({ email: trimmedEmail, password });
      } else {
        await register({ email: trimmedEmail, username: trimmedUsername, password });
      }
    } catch {}
  }

  const error = tab === "login" ? loginError : registerError;
  const pending = tab === "login" ? isLoggingIn : isRegistering;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Monitor className="h-6 w-6 text-purple-400" />
          <span className="text-xl font-semibold text-white tracking-tight">StreamKit</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 mb-6">
            <button
              onClick={() => setTab("login")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                tab === "login" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"
              )}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                tab === "signup" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"
              )}
              data-testid="tab-signup"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-white/70 text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 text-white h-9"
                required
                data-testid="input-email"
              />
            </div>

            {tab === "signup" && (
              <div className="grid gap-1.5">
                <Label className="text-white/70 text-xs">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="bg-white/5 border-white/10 text-white h-9"
                  required
                  data-testid="input-username"
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label className="text-white/70 text-xs">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white h-9"
                required
                minLength={8}
                data-testid="input-password"
              />
              {tab === "signup" && (
                <p className="text-[10px] text-white/30 mt-1">
                  Min 8 characters with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>

            {(formError || error) && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400" data-testid="text-error">
                {formError || (error as any)?.message || "Something went wrong"}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-submit"
            >
              {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tab === "login" ? "Log In" : "Create Account"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#12122a] px-3 text-white/40">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {}}
              data-testid="button-google"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {}}
              data-testid="button-twitch"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="#9146FF"/>
              </svg>
              Twitch
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setTab(tab === "login" ? "signup" : "login")}
            className="text-purple-400 hover:text-purple-300"
            data-testid="link-switch-tab"
          >
            {tab === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
