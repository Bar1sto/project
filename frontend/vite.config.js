import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/admin": {
        target: "http://127.0.0.1:8000/admin",
        changeOrigin: true,
        secure: false,
      },
      "/favorites": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
