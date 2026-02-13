import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import PostListing from "./pages/PostListing";
import SmartSearch from "./pages/SmartSearch";
import MatchBuyers from "./pages/MatchBuyers";
import ProcessorFinder from "./pages/ProcessorFinder";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useApp } from "./context/AppContext";

export default function App() {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading Symbio-Exchange...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toast />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SmartSearch />} />
            <Route path="/match-buyers" element={<MatchBuyers />} />
            <Route path="/processors" element={<ProcessorFinder />} />
            <Route path="/post" element={user ? <PostListing /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
