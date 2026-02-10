import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react()
  ],

  server: {
    port: 5173,
    open: true
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 1500
  },

  resolve: {
    alias: {
      "@": "/src",
      "@config": "/src/config",
      "@utils": "/src/utils",
      "@engines": "/src/engines",
      "@components": "/src/components",
      "@hooks": "/src/hooks"
    }
  }
});
