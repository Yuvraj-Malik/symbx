import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Recycle, LayoutDashboard, PlusCircle, Search, FlaskConical, Route, LogOut, Moon, Sun, LogIn } from "lucide-react";
import { useApp } from "../context/AppContext";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/post", label: "Post Listing", icon: PlusCircle, auth: true },
  { to: "/search", label: "Smart Search", icon: Search },
  { to: "/match-buyers", label: "Match Buyers", icon: FlaskConical },
  { to: "/processors", label: "Processors", icon: Route },
];

export default function Navbar() {
  const { user, logout, darkMode, toggleDarkMode } = useApp();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 glass-card border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:block">Symbio-Exchange</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            if (link.auth && !user) return null;
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link key={link.to} to={link.to} className="relative px-3 py-2 rounded-lg group">
                <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isActive ? "text-green-700 dark:text-green-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-green-100/60 dark:bg-green-900/30 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
              </div>
              <button onClick={logout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary flex items-center gap-1.5 !px-4 !py-2 text-sm">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
