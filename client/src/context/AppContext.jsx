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
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }

    const dark = localStorage.getItem("darkMode") === "true";
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");

    api.get("/master/chemicals")
      .then((res) => setChemicals(res.data))
      .catch((err) => console.error("Failed to load chemicals:", err))
      .finally(() => setLoading(false));
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
