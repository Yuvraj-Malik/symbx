import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    } else if (stored && !token) {
      // Prevent stale UI state where user exists but token is missing.
      localStorage.removeItem("user");
    }

    const dark = localStorage.getItem("darkMode") === "true";
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");

    api.get("/master/chemicals")
      .then((res) => setChemicals(res.data))
      .catch((err) => {
        console.error("Failed to load chemicals:", err);
        showToast("Unable to load chemicals. Some search features may be unavailable.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToast({ message: "Session expired. Please sign in again.", type: "error" });
      setTimeout(() => setToast(null), 3500);
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", next);
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <AppContext.Provider value={{ user, chemicals, loading, darkMode, toggleDarkMode, login, logout, toast, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
