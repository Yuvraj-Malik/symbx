import { Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ChemicalInputRow({ row, index, onChange, onRemove, showOperator = false }) {
  const { chemicals } = useApp();

  return (
    <div className="flex items-center gap-2 mb-2 group">
      <select value={row.chemId} onChange={(e) => onChange(index, "chemId", e.target.value)}
        className="input-base flex-1">
        <option value="">Select Chemical</option>
        {chemicals.map((c) => (
          <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
        ))}
      </select>

      {showOperator && (
        <select value={row.operator || "<"} onChange={(e) => onChange(index, "operator", e.target.value)}
          className="input-base !w-20">
          <option value="<">&lt;</option>
          <option value=">">&gt;</option>
          <option value="<=">&le;</option>
          <option value=">=">&ge;</option>
          <option value="=">=</option>
        </select>
      )}

      <input type="number" min="0" max="100" step="0.1" placeholder="%"
        value={row.percentage ?? row.value ?? ""}
        onChange={(e) => onChange(index, showOperator ? "value" : "percentage", parseFloat(e.target.value) || "")}
        className="input-base !w-24" />

      <button type="button" onClick={() => onRemove(index)}
        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
