import type { Metadata } from "next";
import AgentEyesWrapper from "./agent-eyes-provider";

export const metadata: Metadata = {
  title: "agent-eyes · Next.js Example",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AgentEyesWrapper>{children}</AgentEyesWrapper>
      </body>
    </html>
  );
}
