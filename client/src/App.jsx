import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import PostListing from "./pages/PostListing";
import MatchBuyers from "./pages/MatchBuyers";
import ListingDetails from "./pages/ListingDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Schema from "./pages/Schema";
import { useApp } from "./context/AppContext";

export default function App() {
  const { user, loading } = useApp();
  const location = useLocation();
  const isAuthRoute = ["/login", "/register"].includes(location.pathname);
  const requireAuth = (element) => (user ? element : <Navigate to="/login" replace />);

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
      {!isAuthRoute && <Navbar />}
      <Toast />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={requireAuth(<Dashboard />)} />
            <Route path="/match-buyers" element={requireAuth(<MatchBuyers />)} />
            <Route path="/post" element={requireAuth(<PostListing />)} />
            <Route path="/listings/:id" element={requireAuth(<ListingDetails />)} />
            <Route path="/schema" element={<Schema />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
