// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");

  // Initial load: read from localStorage or system preference
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("elmad-theme");

      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      } else {
        const prefersDark = window.matchMedia?.(
          "(prefers-color-scheme: dark)"
        ).matches;
        setThemeState(prefersDark ? "dark" : "light");
      }
    } catch {
      setThemeState("dark");
    }
  }, []);

  // Apply theme & persist
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      window.localStorage.setItem("elmad-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (value) => {
    setThemeState(value === "light" ? "light" : "dark");
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
