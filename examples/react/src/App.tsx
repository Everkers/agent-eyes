import { AgentEyesProvider } from "agent-eyes";

export default function App() {
  return (
    <AgentEyesProvider config={{ mcpBridge: true, redactPatterns: ["authorization"] }}>
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>👁️ agent-eyes · React</h1>
        <p>Open your agent and ask it what it sees.</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button onClick={() => console.log("Hello from React!", { time: Date.now() })}>
            console.log
          </button>
          <button onClick={() => console.warn("Warning!", { level: "medium" })}>
            console.warn
          </button>
          <button onClick={() => console.error("Error!", new Error("Test error"))}>
            console.error
          </button>
          <button onClick={() => fetch("https://jsonplaceholder.typicode.com/posts/1")}>
            GET request
          </button>
          <button onClick={() => fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer secret-token" },
            body: JSON.stringify({ title: "Test", body: "Hello", userId: 1 }),
          })}>
            POST (with auth)
          </button>
          <button onClick={() => { throw new Error("Unhandled error!"); }}>
            Throw error
          </button>
        </div>
      </div>
    </AgentEyesProvider>
  );
}
