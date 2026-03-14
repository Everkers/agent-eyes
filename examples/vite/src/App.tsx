/**
 * No agent-eyes setup needed here — the Vite plugin in vite.config.ts
 * auto-injects it. Just write your app normally.
 */
export default function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>👁️ agent-eyes · Vite Plugin</h1>
      <p>agent-eyes is auto-injected via <code>agentEyesPlugin()</code> in vite.config.ts</p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button onClick={() => console.log("Hello from Vite!", { time: Date.now() })}>
          console.log
        </button>
        <button onClick={() => console.warn("Warning!", { level: "medium" })}>
          console.warn
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
      </div>
    </div>
  );
}
