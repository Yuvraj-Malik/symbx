import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FlaskConical, AlertTriangle, CheckCircle2, MapPin, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import { useApp } from "../context/AppContext";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import ListingCard from "../components/ListingCard";

export default function MatchBuyers() {
  const [searchParams] = useSearchParams();
  const [supplyId, setSupplyId] = useState(searchParams.get("supplyId") || "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myOffers, setMyOffers] = useState([]);
  const { showToast, user } = useApp();
  const [responding, setResponding] = useState({});

  // Auto-search if supplyId is in URL
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const res = await api.get("/listings/my");
        setMyOffers((res.data || []).filter((l) => l.type === "OFFER"));
      } catch (err) {
        console.error("Failed to load your offers:", err);
      }
    };

    loadOffers();

    if (supplyId) handleSearch();
  }, []); // eslint-disable-line

  const handleSearch = async (listingId = supplyId) => {
    if (!listingId) { setError("Select one of your offers first."); return; }
    if (Number.isNaN(Number(listingId))) { setError("Supply listing ID must be a number."); return; }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await api.post("/search/match-buyers", { supplyListingId: Number(listingId) });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Matching failed. Please try again.");
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
        Pick one of your offers below to find buyers with at least one chemical or criteria overlap.
      </p>

      {/* Your Offers */}
      <div className="glass-card p-6 mb-6">
        {myOffers.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No offers found"
            description="Create an offer first, then return here to see matching buyers."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myOffers.map((offer, index) => (
              <div key={offer.id}>
                <ListingCard
                  listing={offer}
                  index={index}
                  showManageActions
                  onFindBuyers={(id) => {
                    setSupplyId(String(id));
                    handleSearch(id);
                  }}
                  findLoading={loading}
                />
              </div>
            ))}
          </div>
        )}
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
                description={results.note || "No demand listings share any chemical overlap with this offer."} />
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
                    {(() => {
                      const isOwner = myOffers.some((o) => o.id === results.supplyListing.id);
                      if (!isOwner) {
                        return (
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  setResponding((s) => ({ ...s, [m.demand_id]: "accept" }));
                                  const res = await api.post("/search/decisions/respond", {
                                    offerListingId: results.supplyListing.id,
                                    decision: "ACCEPTED",
                                  });
                                  showToast(res.data.outcome, "success");
                                  // Clear results since offer is closed on accept
                                  setResults(null);
                                } catch (err) {
                                  const msg = err.response?.data?.error || "Failed to accept.";
                                  showToast(msg, "error");
                                } finally {
                                  setResponding((s) => ({ ...s, [m.demand_id]: null }));
                                }
                              }}
                              disabled={responding[m.demand_id]}
                              className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm disabled:opacity-60"
                            >
                              {responding[m.demand_id] === "accept" ? "Working..." : "Accept"}
                            </button>

                            <button
                              onClick={async () => {
                                try {
                                  setResponding((s) => ({ ...s, [m.demand_id]: "reject" }));
                                  const res = await api.post("/search/decisions/respond", {
                                    offerListingId: results.supplyListing.id,
                                    decision: "REJECTED",
                                  });
                                  showToast(res.data.outcome, "info");
                                  // Refresh matches after rejection
                                  handleSearch();
                                } catch (err) {
                                  const msg = err.response?.data?.error || "Failed to reject.";
                                  showToast(msg, "error");
                                } finally {
                                  setResponding((s) => ({ ...s, [m.demand_id]: null }));
                                }
                              }}
                              disabled={responding[m.demand_id]}
                              className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-60"
                            >
                              {responding[m.demand_id] === "reject" ? "Working..." : "Reject"}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <p className="mt-3 text-xs text-gray-500">Only buyers can Accept/Reject offers from the offer page.</p>
                      );
                    })()}
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
