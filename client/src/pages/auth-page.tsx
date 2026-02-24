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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (tab === "login") {
        await login({ email, password });
      } else {
        await register({ email, username, password });
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
                minLength={6}
                data-testid="input-password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400" data-testid="text-error">
                {(error as any)?.message || "Something went wrong"}
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
