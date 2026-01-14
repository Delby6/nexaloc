import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ✅ Enables "@/..." imports
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/core"], // ✅ Prevent prebundling FFmpeg
  },
  build: {
    commonjsOptions: {
      include: [/ffmpeg/, /node_modules/],
    },
  },
  server: {
    overlay: true, // optional - keeps error overlay visible
  },
});
