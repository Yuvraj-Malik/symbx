import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Building2, Mail, Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import PageWrapper from "../components/PageWrapper";

const INDUSTRIES = ["Thermal", "Cement", "Steel", "Pharmaceutical", "Chemical", "Mining", "Textile", "Other"];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", industry_type: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useApp();
  const navigate = useNavigate();

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      showToast("Registration successful! Please login.", "success");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join the industrial symbiosis network</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Company Name" value={form.name} onChange={(e) => update("name", e.target.value)}
              className="input-base !pl-10" required />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="input-base !pl-10" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)}
              className="input-base !pl-10" required />
          </div>
          <select value={form.industry_type} onChange={(e) => update("industry_type", e.target.value)}
            className="input-base" required>
            <option value="">Select Industry Type</option>
            {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Location (e.g. Mumbai, MH)" value={form.location} onChange={(e) => update("location", e.target.value)}
              className="input-base !pl-10" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-green-600 dark:text-green-400 hover:underline font-medium">Sign In</Link>
        </p>
      </motion.div>
    </PageWrapper>
  );
}
