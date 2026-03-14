import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agentEyesPlugin } from "agent-eyes/vite";

export default defineConfig({
  plugins: [react(), agentEyesPlugin()],
});
