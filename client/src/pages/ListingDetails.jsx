import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Factory, MapPin, Building2, CheckCircle, XCircle, Trash2, Edit2, Loader, Plus } from "lucide-react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import ChemicalInputRow from "../components/ChemicalInputRow";
import { useApp } from "../context/AppContext";

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, chemicals, showToast } = useApp();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
        setEditData({
          materialName: res.data.material_name,
          quantity: res.data.total_quantity,
          composition: (res.data.composition || []).map((item) => ({
            chemId: item.chem_id,
            percentage: item.percentage,
          })),
          criteria: (res.data.criteria || []).map((item) => ({
            chemId: item.chem_id,
            minPercentage: item.min_percentage ?? "",
            maxPercentage: item.max_percentage ?? "",
          })),
        });
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadListing();
    }
  }, [id]);

  const updateCompositionRow = (index, field, value) => {
    setEditData((prev) => ({
      ...prev,
      composition: prev.composition.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addCompositionRow = () => {
    setEditData((prev) => ({
      ...prev,
      composition: [...(prev.composition || []), { chemId: "", percentage: "" }],
    }));
  };

  const removeCompositionRow = (index) => {
    setEditData((prev) => ({
      ...prev,
      composition: prev.composition.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const updateCriteriaRow = (index, field, value) => {
    setEditData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addCriteriaRow = () => {
    setEditData((prev) => ({
      ...prev,
      criteria: [...(prev.criteria || []), { chemId: "", minPercentage: "", maxPercentage: "" }],
    }));
  };

  const removeCriteriaRow = (index) => {
    setEditData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const refreshListing = () => {
    api.get(`/listings/${id}`)
      .then((r) => {
        setListing(r.data);
        setEditData({
          materialName: r.data.material_name,
          quantity: r.data.total_quantity,
          composition: (r.data.composition || []).map((item) => ({
            chemId: item.chem_id,
            percentage: item.percentage,
          })),
          criteria: (r.data.criteria || []).map((item) => ({
            chemId: item.chem_id,
            minPercentage: item.min_percentage ?? "",
            maxPercentage: item.max_percentage ?? "",
          })),
        });
      })
      .catch((err) => console.error("Refresh error:", err));
  };

  // Accept or reject the offer directly.
  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const respondRes = await api.post("/search/decisions/respond", {
        offerListingId: listing.id,
        decision: "ACCEPTED",
      });

      showToast(respondRes.data.outcome, "success");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to accept listing.";
      showToast(errorMsg, "error");
      console.error("Accept error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      const respondRes = await api.post("/search/decisions/respond", {
        offerListingId: listing.id,
        decision: "REJECTED",
      });

      showToast(respondRes.data.outcome, "info");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to reject listing.";
      showToast(errorMsg, "error");
      console.error("Reject error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update listing
  const handleUpdate = async () => {
    if (!editData.materialName || !editData.quantity) {
      showToast("Material name and quantity are required.", "error");
      return;
    }

    const payload = {
      materialName: editData.materialName,
      quantity: Number(editData.quantity),
    };

    if (listing.type === "OFFER") {
      const rows = (editData.composition || []).filter((row) => row.chemId && row.percentage !== "");
      if (!rows.length) {
        showToast("Add at least one composition row.", "error");
        return;
      }
      payload.composition = rows.map((row) => ({
        chemId: row.chemId,
        percentage: Number(row.percentage),
      }));
    } else {
      const rows = (editData.criteria || []).filter((row) => row.chemId && (row.minPercentage !== "" || row.maxPercentage !== ""));
      if (!rows.length) {
        showToast("Add at least one acceptance criterion.", "error");
        return;
      }
      payload.criteria = rows.map((row) => ({
        chemId: row.chemId,
        minPercentage: row.minPercentage !== "" ? Number(row.minPercentage) : null,
        maxPercentage: row.maxPercentage !== "" ? Number(row.maxPercentage) : null,
      }));
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/listings/${id}`, payload);
      setListing(res.data.listing);
      setEditData({
        materialName: res.data.listing.material_name,
        quantity: res.data.listing.total_quantity,
        composition: (res.data.listing.composition || []).map((item) => ({
          chemId: item.chem_id,
          percentage: item.percentage,
        })),
        criteria: (res.data.listing.criteria || []).map((item) => ({
          chemId: item.chem_id,
          minPercentage: item.min_percentage ?? "",
          maxPercentage: item.max_percentage ?? "",
        })),
      });
      setEditMode(false);
      showToast("Listing updated successfully.", "success");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update listing.";
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete listing
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setSubmitting(true);
    try {
      await api.delete(`/listings/${id}`);
      showToast("Listing deleted successfully.", "success");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to delete listing.";
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="max-w-4xl mx-auto">
        <div className="glass-card p-6">
          <p className="text-gray-600 dark:text-gray-300">Loading listing details...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error || !listing) {
    return (
      <PageWrapper className="max-w-4xl mx-auto">
        <div className="glass-card p-6 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error || "Listing not found."}</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const isOffer = listing.type === "OFFER";
  const isOwnedByUser = user && user.id === listing.user_id;
  const canActOnOffer = !isOwnedByUser && isOffer && listing.status === "ACTIVE";
  const canEditListing = isOwnedByUser && listing.status === "ACTIVE";

  return (
    <PageWrapper className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isOffer
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
            }`}>
              {isOffer ? <Factory className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.material_name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {listing.type} · {listing.total_quantity} tons · {listing.status}
              </p>
            </div>
          </div>
          <span className={`pill ${
            isOffer ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
          }`}>
            {listing.type}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{listing.user?.name || listing.userName || "Unknown company"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{listing.user?.location || listing.location || "Location unavailable"}</span>
          </div>
        </div>

        {listing.composition?.length > 0 && !editMode && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Composition</h2>
            <div className="space-y-2">
              {listing.composition.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{item.chemName || item.chem_id}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {listing.criteria?.length > 0 && !editMode && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Acceptance Criteria</h2>
            <div className="space-y-2">
              {listing.criteria.map((item, idx) => {
                let range = "Any";
                if (item.min_percentage != null && item.max_percentage != null) {
                  range = `${item.min_percentage}% - ${item.max_percentage}%`;
                } else if (item.min_percentage != null) {
                  range = `>= ${item.min_percentage}%`;
                } else if (item.max_percentage != null) {
                  range = `<= ${item.max_percentage}%`;
                }

                return (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
                    <span className="text-sm text-gray-800 dark:text-gray-200">{item.chemName || item.chem_id}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{range}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {editMode && canEditListing && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Listing</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Name</label>
                <input
                  type="text"
                  value={editData.materialName || ""}
                  onChange={(e) => setEditData({ ...editData, materialName: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity (tons)</label>
                <input
                  type="number"
                  value={editData.quantity || ""}
                  onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {listing.type === "OFFER" ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Composition Rows</h3>
                    <button type="button" onClick={addCompositionRow} className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <Plus className="w-3.5 h-3.5" /> Add Chemical
                    </button>
                  </div>
                  {(editData.composition || []).map((row, index) => (
                    <ChemicalInputRow
                      key={`${row.chemId || "new"}-${index}`}
                      row={row}
                      index={index}
                      onChange={updateCompositionRow}
                      onRemove={removeCompositionRow}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Acceptance Criteria</h3>
                    <button type="button" onClick={addCriteriaRow} className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <Plus className="w-3.5 h-3.5" /> Add Criterion
                    </button>
                  </div>
                  {(editData.criteria || []).map((row, index) => (
                    <div key={`${row.chemId || "new"}-${index}`} className="flex items-center gap-2 mb-2 group">
                      <select
                        value={row.chemId || ""}
                        onChange={(e) => updateCriteriaRow(index, "chemId", e.target.value)}
                        className="input-base flex-1"
                      >
                        <option value="">Select Chemical</option>
                        {chemicals.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.id})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Min %"
                        value={row.minPercentage}
                        onChange={(e) => updateCriteriaRow(index, "minPercentage", e.target.value)}
                        className="input-base !w-24"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Max %"
                        value={row.maxPercentage}
                        onChange={(e) => updateCriteriaRow(index, "maxPercentage", e.target.value)}
                        className="input-base !w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removeCriteriaRow(index)}
                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {canEditListing && !editMode && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Listing</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg disabled:opacity-50"
                disabled={submitting}
              >
                <Edit2 className="w-4 h-4 inline mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg disabled:opacity-50"
                disabled={submitting}
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Buyer Actions */}
        {canActOnOffer && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accept or Reject</h2>

            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-4 py-3 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Choose whether to accept this offer from {listing.user?.name || "the seller"} or reject it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-4 py-3 rounded-lg font-semibold text-white transition bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Accept
                </button>

                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-4 py-3 rounded-lg font-semibold text-white transition bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {listing.status === "CLOSED" && !isOwnedByUser && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-4 py-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">This offer has already been accepted and is now closed.</p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
