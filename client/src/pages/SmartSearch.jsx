import { useState } from "react";
import { Sparkles, Search, Plus, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import ChemicalInputRow from "../components/ChemicalInputRow";
import ListingCard from "../components/ListingCard";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

export default function SmartSearch() {
  const [prompt, setPrompt] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState("");

  const [filters, setFilters] = useState([{ chemId: "", operator: "<", value: "" }]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const addFilter = () => setFilters((p) => [...p, { chemId: "", operator: "<", value: "" }]);
  const removeFilter = (i) => setFilters((p) => p.filter((_, idx) => idx !== i));
  const updateFilter = (i, field, value) => setFilters((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleMagicFill = async () => {
    if (!prompt.trim()) return;
    setParsing(true);
    setParseNote("");
    try {
      const res = await api.post("/utils/parse-prompt", { prompt });
      const { filters: parsed, note } = res.data;
      if (parsed && parsed.length > 0) {
        setFilters(parsed.map((f) => ({ chemId: f.chemId, operator: f.operator, value: f.value })));
        setParseNote(note || "Filters populated! Review and click Search.");
      } else {
        setParseNote(note || "No filters extracted. Use manual inputs below.");
      }
    } catch {
      setParseNote("Parser unavailable. Use the manual filters below.");
    } finally {
      setParsing(false);
    }
  };

  const handleSearch = async () => {
    const valid = filters.filter((f) => f.chemId && f.value !== "" && f.value !== undefined);
    if (valid.length === 0) { setParseNote("Add at least one filter."); return; }

    setSearching(true);
    setSearched(false);
    try {
      const res = await api.post("/search/match", {
        filters: valid.map((f) => ({ chemId: f.chemId, operator: f.operator, value: Number(f.value) })),
      });
      setResults(res.data);
      setSearched(true);
      setParseNote("");
    } catch (err) {
      setParseNote(err.response?.data?.error || "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <PageWrapper className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        <span className="gradient-text">Smart</span> Search
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Describe what you need in plain English, or use manual filters.
      </p>

      {/* AI Prompt Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI-Powered Prompt</h2>
          <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]">BETA</span>
        </div>
        <textarea rows={3}
          placeholder='Try: "I need fly ash with less than 1% sulfur and more than 50% silica"'
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          className="input-base resize-none mb-3" />
        <motion.button onClick={handleMagicFill} disabled={parsing || !prompt.trim()}
          whileTap={{ scale: 0.97 }}
          className="btn-accent flex items-center gap-2">
          {parsing
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Wand2 className="w-4 h-4" />}
          {parsing ? "Parsing..." : "Magic Fill"}
        </motion.button>

        <AnimatePresence>
          {parseNote && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              {parseNote}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Manual Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Chemical Filters</h2>
        <p className="text-xs text-gray-400 mb-4">
          These are the source of truth. Magic Fill pre-populates them — adjust as needed.
        </p>

        {filters.map((row, i) => (
          <ChemicalInputRow key={i} row={row} index={i} onChange={updateFilter} onRemove={removeFilter} showOperator />
        ))}

        <div className="flex items-center justify-between mt-4">
          <button type="button" onClick={addFilter}
            className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Filter
          </button>
          <motion.button onClick={handleSearch} disabled={searching} whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2">
            {searching
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            {searching ? "Searching..." : "Search"}
          </motion.button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {searched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Results <span className="text-gray-400 font-normal">({results.length})</span>
            </h2>
            {searching ? (
              <div className="grid gap-4">{[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : results.length === 0 ? (
              <EmptyState icon={Search} title="No matches" description="Try adjusting your filters or broadening the criteria." />
            ) : (
              <div className="grid gap-4">
                {results.map((r, i) => <ListingCard key={r.id} listing={r} index={i} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
