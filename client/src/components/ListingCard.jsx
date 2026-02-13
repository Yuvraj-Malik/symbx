import { motion } from "framer-motion";
import { Package, Factory, MapPin, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import CompositionBar from "./CompositionBar";

export default function ListingCard({ listing, index = 0 }) {
  const isOffer = listing.type === "OFFER";
  const composition = listing.composition || [];
  const criteria = listing.criteria || [];
  const userName = listing.user?.name || listing.user_name || "Unknown";
  const industry = listing.user?.industry_type || listing.industry_type || "";
  const location = listing.user?.location || listing.location || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card glow-border p-5 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOffer
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
              : "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
          }`}>
            {isOffer ? <Factory className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{listing.material_name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>{userName}</span>
              {industry && <span>· {industry}</span>}
            </p>
          </div>
        </div>
        <span className={`pill ${
          isOffer ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
        }`}>
          {listing.type}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          {listing.total_quantity} tons
        </span>
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {location}
          </span>
        )}
        {listing.createdAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {new Date(listing.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* OFFER: Composition bar */}
      {composition.length > 0 && <CompositionBar composition={composition} />}

      {/* DEMAND: Acceptance criteria pills */}
      {criteria.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Acceptance Criteria:</p>
          <div className="flex flex-wrap gap-1.5">
            {criteria.map((crit, idx) => {
              const chem = crit.chemical || crit;
              const name = chem.chem_name || chem.name || crit.chem_id;
              const min = crit.min_percentage;
              const max = crit.max_percentage;
              let label = name + ": ";
              if (min != null && max != null) label += `${min}%–${max}%`;
              else if (min != null) label += `≥${min}%`;
              else if (max != null) label += `≤${max}%`;
              return (
                <span key={idx} className="pill bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Hover action hint */}
      {isOffer && listing.id && (
        <Link to={`/match-buyers?supplyId=${listing.id}`}
          className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Find matching buyers <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </motion.div>
  );
}
