import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const tables = [
  {
    name: "users",
    description: "Stores all registered industries/factories on the platform",
    role: "Core entity - represents all marketplace participants",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "name", type: "TEXT", key: "Regular", constraints: "NOT NULL", nullable: false },
      { name: "email", type: "TEXT", key: "UNIQUE", constraints: "NOT NULL, UNIQUE", nullable: false },
      { name: "password_hash", type: "TEXT", key: "Regular", constraints: "NOT NULL", nullable: false },
      { name: "industry_type", type: "TEXT", key: "Regular", constraints: "NOT NULL", nullable: false },
      { name: "location", type: "TEXT", key: "Regular", constraints: "DEFAULT NULL", nullable: true },
      { name: "created_at", type: "TEXT", key: "Regular", constraints: "DEFAULT CURRENT_TIMESTAMP", nullable: false },
    ],
    relationships: ["1:N → listings", "1:N → process_capabilities", "1:N → offer_decisions"],
  },
  {
    name: "chemicals",
    description: "Master lookup table for all chemical compounds used in the marketplace",
    role: "Reference data - used by dropdowns and chemical matching logic",
    columns: [
      { name: "id", type: "TEXT(10)", key: "PRIMARY KEY", constraints: "e.g. 'PB', 'SIO2'", nullable: false },
      { name: "name", type: "TEXT", key: "Regular", constraints: "NOT NULL", nullable: false },
      { name: "hazard_level", type: "TEXT", key: "Regular", constraints: "NOT NULL, CHECK('LOW','MEDIUM','HIGH')", nullable: false },
    ],
    relationships: ["1:N ← batch_composition", "1:N ← acceptance_criteria", "M:N ↔ hazard_matrix", "1:N ← process_capabilities"],
  },
  {
    name: "listings",
    description: "Central transactional table - OFFER or DEMAND posts by users",
    role: "Core transaction - represents all market supply and demand",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "user_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → users(id), ON DELETE CASCADE", nullable: false },
      { name: "type", type: "TEXT", key: "Regular", constraints: "CHECK('OFFER', 'DEMAND')", nullable: false },
      { name: "material_name", type: "TEXT", key: "Regular", constraints: "NOT NULL", nullable: false },
      { name: "total_quantity", type: "REAL", key: "Regular", constraints: "NOT NULL, > 0", nullable: false },
      { name: "status", type: "TEXT", key: "Regular", constraints: "CHECK('ACTIVE','CLOSED','EXPIRED')", nullable: false },
      { name: "created_at", type: "TEXT", key: "Regular", constraints: "DEFAULT CURRENT_TIMESTAMP", nullable: false },
    ],
    relationships: ["N:1 ← users", "1:N → batch_composition", "1:N → acceptance_criteria", "1:N ↔ offer_decisions"],
  },
  {
    name: "hidden_listings",
    description: "Per-user visibility control for listings - when a user rejects an OFFER",
    role: "User preference - hides rejected listings per user while keeping them visible to others",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "user_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → users(id), ON DELETE CASCADE", nullable: false },
      { name: "listing_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → listings(id), ON DELETE CASCADE", nullable: false },
      { name: "hidden_at", type: "TEXT", key: "Regular", constraints: "DEFAULT CURRENT_TIMESTAMP", nullable: false },
    ],
    relationships: ["N:1 → users", "N:1 → listings"],
  },
  {
    name: "batch_composition",
    description: "Defines what chemicals are inside a waste stream - the 1-to-Many composition link",
    role: "Composition detail - each row says 'Listing #X contains Y% of Chemical Z'",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "listing_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → listings(id), ON DELETE CASCADE", nullable: false },
      { name: "chem_id", type: "TEXT", key: "FOREIGN KEY", constraints: "FK → chemicals(id), ON DELETE RESTRICT", nullable: false },
      { name: "percentage", type: "REAL", key: "Regular", constraints: "CHECK(0-100)", nullable: false },
    ],
    relationships: ["N:1 → listings", "N:1 → chemicals", "UNIQUE: (listing_id, chem_id)"],
  },
  {
    name: "acceptance_criteria",
    description: "Buyer's min/max constraints on chemicals for DEMAND listings",
    role: "Constraint filter - defines acceptable chemical composition ranges for matching",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "listing_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → listings(id), ON DELETE CASCADE", nullable: false },
      { name: "chem_id", type: "TEXT", key: "FOREIGN KEY", constraints: "FK → chemicals(id), ON DELETE RESTRICT", nullable: false },
      { name: "min_percentage", type: "REAL", key: "Regular", constraints: "CHECK(≥0), DEFAULT NULL", nullable: true },
      { name: "max_percentage", type: "REAL", key: "Regular", constraints: "CHECK(≤100), DEFAULT NULL", nullable: true },
    ],
    relationships: ["N:1 → listings", "N:1 → chemicals", "UNIQUE: (listing_id, chem_id)"],
  },
  {
    name: "hazard_matrix",
    description: "Many-to-Many safety rules - defines incompatible chemical pairs",
    role: "Safety constraint - prevents dangerous chemical combinations in transactions",
    columns: [
      { name: "chem_id_1", type: "TEXT", key: "PRIMARY KEY (Composite)", constraints: "FK → chemicals(id)", nullable: false },
      { name: "chem_id_2", type: "TEXT", key: "PRIMARY KEY (Composite)", constraints: "FK → chemicals(id)", nullable: false },
      { name: "is_incompatible", type: "INTEGER", key: "Regular", constraints: "CHECK(0,1), DEFAULT 0", nullable: false },
    ],
    relationships: ["N:N ↔ chemicals", "CHECK: chem_id_1 < chem_id_2"],
  },
  {
    name: "process_capabilities",
    description: "Processor conversion graph - what a processor can convert from one chemical to another",
    role: "Intermediary processor - enables 'A → C → B' conversion paths for material matching",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "processor_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → users(id), ON DELETE CASCADE", nullable: false },
      { name: "input_chem_id", type: "TEXT", key: "FOREIGN KEY", constraints: "FK → chemicals(id), ON DELETE RESTRICT", nullable: false },
      { name: "output_chem_id", type: "TEXT", key: "FOREIGN KEY", constraints: "FK → chemicals(id), ON DELETE RESTRICT", nullable: false },
      { name: "conversion_efficiency", type: "REAL", key: "Regular", constraints: "CHECK(0-1), e.g. 0.85 = 85%", nullable: false },
    ],
    relationships: ["N:1 → users (processor)", "N:1 → chemicals (input)", "N:1 → chemicals (output)"],
  },
  {
    name: "offer_decisions",
    description: "Tracks decision state between one OFFER and one DEMAND listing - two-step handshake",
    role: "Transaction controller - coordinates final acceptance between seller and buyer",
    columns: [
      { name: "id", type: "INTEGER", key: "PRIMARY KEY", constraints: "Auto-Increment", nullable: false },
      { name: "offer_listing_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → listings(id), ON DELETE CASCADE", nullable: false },
      { name: "demand_listing_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → listings(id), ON DELETE CASCADE", nullable: false },
      { name: "seller_user_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → users(id), ON DELETE CASCADE", nullable: false },
      { name: "buyer_user_id", type: "INTEGER", key: "FOREIGN KEY", constraints: "FK → users(id), ON DELETE CASCADE", nullable: false },
      { name: "seller_decision", type: "TEXT", key: "Regular", constraints: "CHECK('PENDING','ACCEPTED','REJECTED')", nullable: false },
      { name: "buyer_decision", type: "TEXT", key: "Regular", constraints: "CHECK('PENDING','ACCEPTED','REJECTED')", nullable: false },
      { name: "final_status", type: "TEXT", key: "Regular", constraints: "CHECK('OPEN','ACCEPTED','REJECTED','CANCELLED')", nullable: false },
      { name: "created_at", type: "TEXT", key: "Regular", constraints: "DEFAULT CURRENT_TIMESTAMP", nullable: false },
      { name: "updated_at", type: "TEXT", key: "Regular", constraints: "DEFAULT CURRENT_TIMESTAMP", nullable: false },
    ],
    relationships: ["N:1 → listings (OFFER)", "N:1 → listings (DEMAND)", "N:1 → users (seller)", "N:1 → users (buyer)"],
  },
];

const tableNodes = {
  users: { name: "users", x: 80, y: 40, w: 200, h: 160, color: "#22c55e", shortLabel: "Industries" },
  chemicals: { name: "chemicals", x: 700, y: 40, w: 220, h: 160, color: "#22c55e", shortLabel: "Master Data" },
  listings: { name: "listings", x: 1350, y: 40, w: 240, h: 160, color: "#22c55e", shortLabel: "Transactions" },
  batch_composition: { name: "batch_composition", x: 50, y: 380, w: 240, h: 140, color: "#3b82f6", shortLabel: "Composition" },
  acceptance_criteria: { name: "acceptance_criteria", x: 450, y: 380, w: 240, h: 140, color: "#3b82f6", shortLabel: "Constraints" },
  hidden_listings: { name: "hidden_listings", x: 1300, y: 380, w: 220, h: 140, color: "#ec4899", shortLabel: "Preferences" },
  hazard_matrix: { name: "hazard_matrix", x: 200, y: 750, w: 240, h: 140, color: "#a855f7", shortLabel: "Safety" },
  process_capabilities: { name: "process_capabilities", x: 650, y: 750, w: 260, h: 160, color: "#f59e0b", shortLabel: "Processors" },
  offer_decisions: { name: "offer_decisions", x: 1250, y: 750, w: 260, h: 160, color: "#06b6d4", shortLabel: "Transactions" },
};

const relations = [
  {
    id: "users-listings",
    from: "users",
    to: "listings",
    label: "1:N",
    type: "One user can own many listings",
    dashed: false,
    d: "M 280 120 C 620 80, 1010 80, 1350 120",
  },
  {
    id: "listings-batch",
    from: "listings",
    to: "batch_composition",
    label: "1:N",
    type: "One listing can have many composition rows",
    dashed: false,
    d: "M 1350 200 C 1110 240, 520 240, 290 380",
  },
  {
    id: "listings-acceptance",
    from: "listings",
    to: "acceptance_criteria",
    label: "1:N",
    type: "One listing can have many acceptance criteria",
    dashed: false,
    d: "M 1350 215 C 1080 270, 760 285, 690 410",
  },
  {
    id: "chemicals-batch",
    from: "chemicals",
    to: "batch_composition",
    label: "1:N",
    type: "One chemical can appear in many batch composition rows",
    dashed: true,
    d: "M 700 150 C 580 230, 390 300, 290 395",
  },
  {
    id: "chemicals-acceptance",
    from: "chemicals",
    to: "acceptance_criteria",
    label: "1:N",
    type: "One chemical can appear in many acceptance criteria rows",
    dashed: true,
    d: "M 810 200 C 810 270, 760 320, 690 425",
  },
  {
    id: "chemicals-hazard",
    from: "chemicals",
    to: "hazard_matrix",
    label: "M:N",
    type: "Chemicals relate to each other through hazard_matrix",
    dashed: true,
    d: "M 730 200 C 600 380, 430 610, 320 750",
  },
  {
    id: "users-process",
    from: "users",
    to: "process_capabilities",
    label: "1:N",
    type: "One processor user can define many conversion rules",
    dashed: false,
    d: "M 220 200 C 300 390, 510 600, 650 780",
  },
  {
    id: "chemicals-process-input",
    from: "chemicals",
    to: "process_capabilities",
    label: "1:N",
    type: "One chemical can be an input to many process capabilities",
    dashed: true,
    d: "M 860 200 C 840 390, 810 600, 790 750",
  },
  {
    id: "listings-hidden",
    from: "listings",
    to: "hidden_listings",
    label: "1:N",
    type: "One listing can be hidden for many users",
    dashed: false,
    d: "M 1470 200 C 1500 270, 1470 320, 1410 380",
  },
  {
    id: "users-hidden",
    from: "users",
    to: "hidden_listings",
    label: "1:N",
    type: "One user can hide many listings",
    dashed: true,
    d: "M 280 100 C 760 180, 1120 260, 1300 430",
  },
  {
    id: "users-offer",
    from: "users",
    to: "offer_decisions",
    label: "1:N",
    type: "Seller and buyer users participate in many decisions",
    dashed: false,
    d: "M 260 150 C 520 310, 920 540, 1250 830",
  },
  {
    id: "listings-offer",
    from: "listings",
    to: "offer_decisions",
    label: "1:N",
    type: "One offer or demand listing can appear in many decisions",
    dashed: false,
    d: "M 1470 200 C 1460 360, 1430 580, 1380 750",
  },
];

function getRelationTables(relation) {
  if (!relation) return new Set();
  return new Set([relation.from, relation.to]);
}

function TableNode({ node, relationActive, relationTables }) {
  const highlighted = !relationActive || relationTables.has(node.name);
  const dimmed = relationActive && !relationTables.has(node.name);

  return (
    <g opacity={dimmed ? 0.28 : 1} pointerEvents="none">
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        fill="#fff"
        stroke={highlighted ? node.color : "#cbd5e1"}
        strokeWidth={highlighted ? 2.8 : 1.4}
        rx="4"
        filter={highlighted ? "drop-shadow(0px 6px 10px rgba(0,0,0,0.10))" : "none"}
      />
      <rect x={node.x} y={node.y} width={node.w} height="28" fill={node.color} rx="4" />
      <text x={node.x + node.w / 2} y={node.y + 21} textAnchor="middle" fill="white" className="table-header text-[19px]">
        {node.name}
      </text>
      <line x1={node.x} y1={node.y + 28} x2={node.x + node.w} y2={node.y + 28} stroke={node.color} strokeWidth="1" />
      <text x={node.x + 10} y={node.y + 50} fill="#333" className="table-text text-[15px]">PK / FK / constraints</text>
      <text x={node.x + 10} y={node.y + 73} fill="#333" className="table-text text-[15px]">role-specific attributes</text>
      <text x={node.x + 10} y={node.y + 106} fill="#0066cc" className="table-text text-[15px]" fontStyle="italic">
        {node.shortLabel}
      </text>
    </g>
  );
}

function RelationPath({ relation, active, onHover, onLeave }) {
  const strokeColor =
    relation.from === "users"
      ? "#22c55e"
      : relation.from === "chemicals"
      ? "#3b82f6"
      : relation.from === "listings"
      ? "#06b6d4"
      : relation.from === "hidden_listings"
      ? "#ec4899"
      : relation.from === "process_capabilities"
      ? "#f59e0b"
      : "#a855f7";

  return (
    <g>
      <path
        d={relation.d}
        fill="none"
        stroke="transparent"
        strokeWidth="18"
        pointerEvents="stroke"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => onHover(relation.id)}
        onMouseOver={() => onHover(relation.id)}
        onPointerEnter={() => onHover(relation.id)}
        onMouseLeave={onLeave}
        onPointerLeave={onLeave}
      />
      <path
        d={relation.d}
        className="curve-path"
        stroke={active ? strokeColor : "#94a3b8"}
        strokeWidth={active ? 4 : 2}
        strokeOpacity={active ? 1 : 0.55}
        strokeDasharray={relation.dashed ? "6,5" : "0"}
        markerStart="url(#markerOne)"
        markerEnd="url(#markerMany)"
        pointerEvents="none"
      >
        <title>{`${relation.from} → ${relation.to} | ${relation.label} | ${relation.type}`}</title>
      </path>
    </g>
  );
}

function TableCard({ table, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Table {index + 1}: <span className="text-green-600 dark:text-green-400">{table.name}</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{table.description}</p>
        </div>
        {expanded ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {/* Role */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Role in System:</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{table.role}</p>
          </div>

          {/* Columns Table */}
          <div className="mb-4 overflow-x-auto">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Columns:</h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Column Name</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Data Type</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Key Type</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Constraints</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-mono text-green-600 dark:text-green-400">
                      {col.name}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-mono text-gray-700 dark:text-gray-300">
                      {col.type}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          col.key === "PRIMARY KEY"
                            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            : col.key === "FOREIGN KEY"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : col.key === "UNIQUE"
                            ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {col.key}
                      </span>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-gray-600 dark:text-gray-400">
                      {col.constraints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relationships */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Relationships & Constraints:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {table.relationships.map((rel, idx) => (
                <li key={idx}>{rel}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Schema() {
  const [showDiagram, setShowDiagram] = useState(false);
  const [hoveredRelationId, setHoveredRelationId] = useState(null);

  const hoveredRelation = relations.find((relation) => relation.id === hoveredRelationId) || null;
  const hoveredTables = getRelationTables(hoveredRelation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Database Schema</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Complete structure of Symbio-Exchange database with 9 tables, relationships, and constraints
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tables</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">9</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400">Core Entities</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">3</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400">Relationship Tables</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">6</p>
          </div>
        </div>

        {/* Tables */}
        <div className="space-y-4 mb-12">
          {tables.map((table, index) => (
            <TableCard key={index} table={table} index={index} />
          ))}
        </div>

        {/* ER Diagram Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-t-4 border-green-500">
          <button
            onClick={() => setShowDiagram(!showDiagram)}
            className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Entity Relationship Diagram (ERD)</h2>
            {showDiagram ? <ChevronUp size={28} className="text-gray-500" /> : <ChevronDown size={28} className="text-gray-500" />}
          </button>

          {showDiagram && (
            <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="pointer-events-none mb-4 rounded-lg border border-gray-200 bg-white/95 px-4 py-3 text-sm text-gray-700 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95 dark:text-gray-200">
                <div className="font-semibold text-gray-900 dark:text-white text-[18px]">Hover any connection to highlight the linked tables.</div>
                <div className="mt-1 min-h-8">
                  {hoveredRelation ? (
                    <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-green-800 dark:bg-green-900/40 dark:text-green-200 text-[16px] leading-5">
                      <span className="font-semibold">{hoveredRelation.label}</span>
                      <span>{hoveredRelation.from}</span>
                      <span>→</span>
                      <span>{hoveredRelation.to}</span>
                      <span className="opacity-80">{hoveredRelation.type}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-[16px]">No connection selected.</span>
                  )}
                </div>
              </div>

              <svg viewBox="0 0 1800 1100" className="w-full min-h-screen dark:bg-gray-900">
                <defs>
                  <style>{`
                    .table-header { font-weight: bold; font-size: 19px; }
                    .table-text { font-size: 15px; }
                    .relationship-label { font-size: 13px; font-weight: bold; }
                    .curve-path { fill: none; stroke-width: 2; }
                  `}</style>
                  <marker id="markerOne" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                    <circle cx="5" cy="4" r="2" fill="#64748b" />
                  </marker>
                  <marker id="markerMany" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                    <path d="M 2 2 L 8 4 L 2 6 Z" fill="#64748b" />
                  </marker>
                </defs>

                <g>
                  {Object.values(tableNodes).map((node) => (
                    <TableNode
                      key={node.name}
                      node={node}
                      relationActive={Boolean(hoveredRelation)}
                      relationTables={hoveredTables}
                    />
                  ))}
                </g>

                <g>
                  {relations.map((relation) => (
                    <RelationPath
                      key={relation.id}
                      relation={relation}
                      active={!hoveredRelationId || hoveredRelationId === relation.id}
                      onHover={setHoveredRelationId}
                      onLeave={() => setHoveredRelationId(null)}
                    />
                  ))}
                </g>

              </svg>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="text-[20px] font-bold text-gray-900 dark:text-white mb-3">Legend</div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-[15px] text-gray-700 dark:text-gray-200">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-green-500" />Core</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-blue-500" />Composition/Filter</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-pink-500" />User Prefs</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-purple-500" />Safety</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-amber-500" />Processors</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-8 rounded bg-cyan-500" />Transactions</span>
                  <span className="inline-flex items-center gap-2"><span className="h-0.5 w-8 bg-gray-500" />Direct Relationship</span>
                  <span className="inline-flex items-center gap-2"><span className="h-0.5 w-8 border-t-2 border-dashed border-gray-500" />Reference Relationship</span>
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gray-500" />One</span>
                  <span className="inline-flex items-center gap-2"><span className="inline-block h-0 w-0 border-y-[5px] border-y-transparent border-l-[10px] border-l-gray-500" />Many</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Core Entities</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>users</strong> - Industries/factories on platform</li>
              <li>• <strong>chemicals</strong> - Master reference data</li>
              <li>• <strong>listings</strong> - OFFER or DEMAND transactions</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Relationship Tables</h3>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• <strong>batch_composition</strong> - What's in the waste</li>
              <li>• <strong>acceptance_criteria</strong> - Buyer requirements</li>
              <li>• <strong>hazard_matrix</strong> - Safety constraints</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
