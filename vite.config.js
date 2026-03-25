// vite.config.js
// This tells Vite which plugins to use when building your app.
// react() makes Vite understand JSX files.
// tailwindcss() wires Tailwind directly into Vite — no PostCSS needed.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});