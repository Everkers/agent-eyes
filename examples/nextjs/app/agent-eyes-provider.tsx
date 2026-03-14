"use client";

import { AgentEyesProvider } from "@everkers/agent-eyes";

export default function AgentEyesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AgentEyesProvider
      config={{
        mcpBridge: true,
        redactPatterns: ["authorization", "cookie", "token"],
      }}
    >
      {children}
    </AgentEyesProvider>
  );
}
