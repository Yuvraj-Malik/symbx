import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useApp } from "../context/AppContext";

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const BG = {
  success: "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800",
  error: "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800",
  warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800",
};

export default function Toast() {
  const { toast } = useApp();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${BG[toast.type]}`}
        >
          {ICONS[toast.type]}
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
