import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Package, Plus, Send } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useApp } from "../context/AppContext";
import PageWrapper from "../components/PageWrapper";
import ChemicalInputRow from "../components/ChemicalInputRow";

export default function PostListing() {
  const navigate = useNavigate();
  const { chemicals, showToast } = useApp();
  const [type, setType] = useState("OFFER");
  const [materialName, setMaterialName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [composition, setComposition] = useState([{ chemId: "", percentage: "" }]);
  const [criteria, setCriteria] = useState([{ chemId: "", minPercentage: "", maxPercentage: "" }]);

  const addCompRow = () => setComposition((p) => [...p, { chemId: "", percentage: "" }]);
  const removeCompRow = (i) => setComposition((p) => p.filter((_, idx) => idx !== i));
  const updateCompRow = (i, field, value) => setComposition((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const addCritRow = () => setCriteria((p) => [...p, { chemId: "", minPercentage: "", maxPercentage: "" }]);
  const removeCritRow = (i) => setCriteria((p) => p.filter((_, idx) => idx !== i));
  const updateCritRow = (i, field, value) => setCriteria((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!materialName || !quantity) {
      setError("Please fill in material name and quantity.");
      return;
    }

    const payload = { type, materialName, quantity: Number(quantity) };

    if (type === "OFFER") {
      const validComp = composition.filter((c) => c.chemId && c.percentage);
      if (validComp.length === 0) { setError("Add at least one chemical."); return; }
      const totalPct = validComp.reduce((s, c) => s + Number(c.percentage), 0);
      if (totalPct > 100) { setError("Total percentage cannot exceed 100%."); return; }
      payload.composition = validComp.map((c) => ({ chemId: c.chemId, percentage: Number(c.percentage) }));
    } else {
      const validCrit = criteria.filter((c) => c.chemId && (c.minPercentage !== "" || c.maxPercentage !== ""));
      if (validCrit.length === 0) { setError("Add at least one acceptance criterion."); return; }
      payload.criteria = validCrit.map((c) => ({
        chemId: c.chemId,
        minPercentage: c.minPercentage !== "" ? Number(c.minPercentage) : null,
        maxPercentage: c.maxPercentage !== "" ? Number(c.maxPercentage) : null,
      }));
    }

    setSubmitting(true);
    try {
      await api.post("/listings", payload);
      showToast("Listing posted successfully!", "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Post a <span className="gradient-text">Listing</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Offer your waste or demand raw materials.</p>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="flex gap-3">
          {[
            { val: "OFFER", label: "I Have (Offer)", icon: Factory, color: "blue" },
            { val: "DEMAND", label: "I Need (Demand)", icon: Package, color: "orange" },
          ].map((t) => (
            <motion.button key={t.val} type="button" onClick={() => setType(t.val)}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                type === t.val
                  ? (t.color === "blue"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                      : "bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30")
                  : "glass-card text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </motion.button>
          ))}
        </div>

        <div className="glass-card p-5 space-y-4">
          <input placeholder="Material Name (e.g. Fly Ash, Blast Furnace Slag)" value={materialName}
            onChange={(e) => setMaterialName(e.target.value)} className="input-base" required />
          <input type="number" placeholder="Quantity (tons)" value={quantity}
            onChange={(e) => setQuantity(e.target.value)} className="input-base" required />
        </div>

        {/* OFFER: Composition */}
        {type === "OFFER" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Chemical Composition</h3>
            <p className="text-xs text-gray-400 mb-3">Define what's inside your waste stream.</p>
            {composition.map((row, i) => (
              <ChemicalInputRow key={i} row={row} index={i} onChange={updateCompRow} onRemove={removeCompRow} />
            ))}
            <button type="button" onClick={addCompRow}
              className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 font-medium mt-2">
              <Plus className="w-3.5 h-3.5" /> Add Chemical
            </button>
          </div>
        )}

        {/* DEMAND: Criteria */}
        {type === "DEMAND" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Acceptance Criteria</h3>
            <p className="text-xs text-gray-400 mb-3">Set min/max percentage for each chemical you care about.</p>
            {criteria.map((row, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 group">
                <select value={row.chemId} onChange={(e) => updateCritRow(i, "chemId", e.target.value)}
                  className="input-base flex-1">
                  <option value="">Select Chemical</option>
                  {chemicals.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
                <input type="number" min="0" max="100" step="0.1" placeholder="Min %"
                  value={row.minPercentage} onChange={(e) => updateCritRow(i, "minPercentage", e.target.value)}
                  className="input-base !w-24" />
                <input type="number" min="0" max="100" step="0.1" placeholder="Max %"
                  value={row.maxPercentage} onChange={(e) => updateCritRow(i, "maxPercentage", e.target.value)}
                  className="input-base !w-24" />
                <button type="button" onClick={() => removeCritRow(i)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ))}
            <button type="button" onClick={addCritRow}
              className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 font-medium mt-2">
              <Plus className="w-3.5 h-3.5" /> Add Criterion
            </button>
          </div>
        )}

        <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.98 }}
          className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
          {submitting
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4" />}
          {submitting ? "Posting..." : "Post Listing"}
        </motion.button>
      </form>
    </PageWrapper>
  );
}
