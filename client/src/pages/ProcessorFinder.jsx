import { useState } from "react";
import { Route, ArrowRight, Zap, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";

export default function ProcessorFinder() {
  const { chemicals } = useApp();
  const [inputChem, setInputChem] = useState("");
  const [outputChem, setOutputChem] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!inputChem || !outputChem) { setError("Select both input and output chemicals."); return; }
    if (inputChem === outputChem) { setError("Input and output must be different."); return; }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await api.post("/search/find-processors", { inputChemId: inputChem, outputChemId: outputChem });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const getChemName = (id) => chemicals.find((c) => c.id === id)?.name || id;

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Processor <span className="gradient-text">Finder</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Find intermediary processors that can convert one chemical into another. Supports 1-hop and 2-hop paths.
      </p>

      {/* Input */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">I have (Input)</label>
            <select value={inputChem} onChange={(e) => setInputChem(e.target.value)} className="input-base">
              <option value="">Select Chemical</option>
              {chemicals.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center pb-2">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">I need (Output)</label>
            <select value={outputChem} onChange={(e) => setOutputChem(e.target.value)} className="input-base">
              <option value="">Select Chemical</option>
              {chemicals.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <motion.button onClick={handleSearch} disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            Find Path
          </motion.button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Routes Found <span className="text-gray-400 font-normal">({results.totalRoutes})</span>
            </h2>

            {results.totalRoutes === 0 ? (
              <EmptyState icon={Route} title="No processing routes"
                description="No registered processor can convert between these chemicals." />
            ) : (
              <div className="space-y-4">
                {/* Direct (1-hop) paths */}
                {results.directPaths.map((p, i) => (
                  <motion.div key={`d-${i}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card glow-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="pill bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Direct</span>
                      <span className="text-xs text-gray-400">1 hop</span>
                    </div>

                    {/* Visual flow */}
                    <div className="flex items-center gap-3 justify-center py-4">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{inputChem}</span>
                        </div>
                        <p className="text-xs text-gray-500">{p.input_name}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <ArrowRight className="w-6 h-6 text-green-500" />
                        <div className="text-center mt-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">{p.processor_name}</p>
                          <p className="text-[10px] text-gray-400">{p.processor_location}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{outputChem}</span>
                        </div>
                        <p className="text-xs text-gray-500">{p.output_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">{(p.conversion_efficiency * 100).toFixed(0)}% efficiency</span>
                    </div>
                  </motion.div>
                ))}

                {/* 2-hop paths */}
                {results.twoHopPaths.map((p, i) => (
                  <motion.div key={`t-${i}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (results.directPaths.length + i) * 0.1 }}
                    className="glass-card glow-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">2-Hop</span>
                      <span className="text-xs text-gray-400">via {p.intermediate_chemical}</span>
                    </div>

                    {/* Visual flow: A → C1 → intermediate → C2 → B */}
                    <div className="flex items-center gap-2 justify-center py-4 flex-wrap">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{inputChem}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{getChemName(inputChem)}</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />

                      <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">{p.processor1_name}</p>
                        <p className="text-[10px] text-gray-400">{(p.step1_efficiency * 100).toFixed(0)}%</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />

                      <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">{p.intermediate_chemical}</span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />

                      <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">{p.processor2_name}</p>
                        <p className="text-[10px] text-gray-400">{(p.step2_efficiency * 100).toFixed(0)}%</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />

                      <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{outputChem}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{getChemName(outputChem)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">{(p.total_efficiency * 100).toFixed(0)}% total efficiency</span>
                    </div>
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
