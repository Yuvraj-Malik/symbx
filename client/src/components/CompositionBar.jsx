import { motion } from "framer-motion";

const COLORS = [
  "bg-green-500", "bg-blue-500", "bg-amber-500", "bg-purple-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-indigo-500",
];

const HAZARD_DOT = {
  LOW: "bg-green-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-red-400",
};

export default function CompositionBar({ composition = [] }) {
  if (!composition.length) return null;

  const sorted = [...composition].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {sorted.map((comp, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${comp.percentage}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
            className={`${COLORS[i % COLORS.length]} first:rounded-l-full last:rounded-r-full`}
            title={`${comp.chemical?.name || comp.chem_name || comp.chem_id}: ${comp.percentage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.map((comp, i) => {
          const chem = comp.chemical || comp;
          const name = chem.chem_name || chem.name || comp.chem_id;
          const hazard = chem.hazard_level || "LOW";
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
              <span className="font-medium">{name}</span>
              <span className="text-gray-400">{comp.percentage}%</span>
              <span className={`w-1.5 h-1.5 rounded-full ${HAZARD_DOT[hazard]}`} title={`Hazard: ${hazard}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
