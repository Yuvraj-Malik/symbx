import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, color = "green", delay = 0 }) {
  const [count, setCount] = useState(0);

  // Animate number counting up
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setCount(0); return; }
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const COLORS = {
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-indigo-600",
    orange: "from-orange-500 to-amber-600",
    purple: "from-purple-500 to-violet-600",
    red: "from-red-500 to-rose-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card glow-border p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[color]} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
}
