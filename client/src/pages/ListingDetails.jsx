import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, Factory, MapPin, Building2 } from "lucide-react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

export default function ListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
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

        {listing.composition?.length > 0 && (
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

        {listing.criteria?.length > 0 && (
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
      </div>
    </PageWrapper>
  );
}
