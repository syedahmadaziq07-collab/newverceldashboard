import { useState, FormEvent } from "react";
import { KeyRound, Lock, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { api, storeToken } from "../lib/api";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter admin passcode.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; token: string }>(
        "/api/admin/login",
        { password }
      );
      if (res.success && res.token) {
        storeToken(res.token);
        onLoginSuccess(res.token);
      } else {
        setError("Login failed — invalid response from server.");
      }
    } catch (err: any) {
      console.error("[login] failed:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            CutPricebot.app
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Admin Dashboard Login
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-500 mb-2">
              ADMIN PASSCODE
            </label>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Access Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Secure connection encrypted · JWT session
        </p>
      </motion.div>
    </div>
  );
}
