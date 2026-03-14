import { startAgentEyesMCP } from "./server.js";

const port = parseInt(process.env.AGENT_EYES_PORT ?? "9960", 10);

startAgentEyesMCP(port).catch((err) => {
  console.error("[agent-eyes] Failed to start:", err);
  process.exit(1);
});
