import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Leaf, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import PageWrapper from "../components/PageWrapper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, showToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      showToast(`Welcome back, ${res.data.user.name}!`, "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#eefbf5_55%,_#ecfeff)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(135deg,_#020617,_#082f49_55%,_#052e16)]" />
      <div className="absolute -top-24 right-[-5rem] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute bottom-[-6rem] left-[-4rem] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />

      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-slate-950/60 dark:text-emerald-300">
            <Leaf className="h-4 w-4" />
            Industrial symbiosis, simplified
          </div>

          <h1 className="mt-6 max-w-2xl text-5xl font-black tracking-tight text-gray-950 dark:text-white sm:text-6xl lg:text-7xl">
            Waste becomes a <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">marketplace</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Symbio-Exchange helps industries post materials, find buyers, match chemistry, and track opportunities without the clutter.
          </p>

          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
              <Zap className="h-5 w-5 text-amber-500" />
              <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Faster decisions</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Post, inspect, and match in one flow.</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Safer matches</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Built-in chemistry and hazard checks.</div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
              <ArrowRight className="h-5 w-5 text-cyan-500" />
              <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Clear next steps</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Everything points to the next action.</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/55">OFFER / DEMAND workflow</span>
            <span className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/55">Hazard-aware matching</span>
            <span className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/55">Schema visibility</span>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="glass-card overflow-hidden border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                <LogIn className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-950 dark:text-white">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Sign in to manage listings, matches, and your database schema view.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base !pl-10 !py-3"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base !pl-10 !py-3"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-base">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100">
              <div className="font-semibold">Testing account</div>
              <div className="mt-2 grid gap-1 text-sm leading-6">
                <div><span className="font-medium">Email:</span> ntpc.dadri@ntpc.co.in</div>
                <div><span className="font-medium">Password:</span> industry123</div>
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              No account?{" "}
              <Link to="/register" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                Register now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
