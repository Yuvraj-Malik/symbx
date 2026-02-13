import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FlaskConical, AlertTriangle, CheckCircle2, MapPin, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

export default function MatchBuyers() {
  const [searchParams] = useSearchParams();
  const [supplyId, setSupplyId] = useState(searchParams.get("supplyId") || "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-search if supplyId is in URL
  useEffect(() => {
    if (supplyId) handleSearch();
  }, []); // eslint-disable-line

  const handleSearch = async () => {
    if (!supplyId) { setError("Enter a supply listing ID."); return; }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await api.post("/search/match-buyers", { supplyListingId: Number(supplyId) });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Matching failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Match <span className="gradient-text">Buyers</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Enter your supply listing ID to find buyers whose acceptance criteria match your waste composition.
      </p>

      {/* Input */}
      <div className="glass-card p-6 mb-6">
        <div className="flex gap-3">
          <input type="number" placeholder="Supply Listing ID (e.g. 1)" value={supplyId}
            onChange={(e) => setSupplyId(e.target.value)}
            className="input-base flex-1" />
          <motion.button onClick={handleSearch} disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <FlaskConical className="w-4 h-4" />}
            {loading ? "Matching..." : "Find Buyers"}
          </motion.button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hazard Warnings */}
            {results.hazardWarnings && results.hazardWarnings.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-700 dark:text-red-400">Transport Hazard Detected</h3>
                </div>
                {results.hazardWarnings.map((w, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400">
                    <strong>{w.chem_a_name}</strong> + <strong>{w.chem_b_name}</strong> are incompatible — special handling required.
                  </p>
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Matching Buyers <span className="text-gray-400 font-normal">({results.matches?.length || 0})</span>
            </h2>

            {loading ? (
              <div className="grid gap-4">{[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : results.matches?.length === 0 ? (
              <EmptyState icon={FlaskConical} title="No matching buyers"
                description="No demand listings have acceptance criteria that your waste composition satisfies." />
            ) : (
              <div className="grid gap-4">
                {results.matches.map((m, i) => (
                  <motion.div key={m.demand_id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card glow-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{m.demand_material}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Demand #{m.demand_id}</p>
                        </div>
                      </div>
                      <span className="pill bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        {m.matched_criteria}/{m.total_criteria} criteria met
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {m.buyer_name} ({m.buyer_industry})</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {m.buyer_location}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Needs: <strong>{m.demand_quantity} tons</strong>
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
