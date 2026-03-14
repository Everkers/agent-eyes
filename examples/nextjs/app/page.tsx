"use client";

export default function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>👁️ agent-eyes · Next.js</h1>
      <p>Using AgentEyesProvider as a client component in layout.tsx</p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button onClick={() => console.log("Hello from Next.js!", { time: Date.now() })}>
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
