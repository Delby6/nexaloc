// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App.jsx";
import "leaflet/dist/leaflet.css";

// 🌗 Theme Provider
import { ThemeProvider } from "@/context/ThemeContext";

import "./index.css";
import { bootstrapPasswordRecovery } from "./recoveryBootstrap";

bootstrapPasswordRecovery();


const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
