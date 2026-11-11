"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

// YOUR JOB: change these sample prompts to match your problem statement.
const SAMPLE_PROMPTS = [
  "Add a task to call the vendor tomorrow, then show all my tasks.",
  "Which tasks are still open?",
  "Mark the vendor call task as done.",
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the last 20 messages are sent, to keep requests small.
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const result = data as AgentResult;
      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);
      if (result.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-card">
      <div className="card-header">
        <h2 className="card-title">Agent</h2>
        <p className="card-description">Ask in plain English. You can see every tool the agent uses.</p>
      </div>

      <div className="agent-conversation">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            <p className="chat-suggestions-intro">Try one of these:</p>
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="chat-suggestion"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-message ${m.role === "user" ? "chat-message-user" : "chat-message-model"}`}
          >
            <div
              className={
                m.role === "user"
                  ? "chat-bubble-user"
                  : "chat-model-content"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.role === "model" ? (
                <div className="chat-model-text">
                  <FormattedText text={m.text} />
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && <p className="chat-loading">Agent is working...</p>}
        {error && <p className="chat-error">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="chat-form"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your request..."
          className="chat-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="chat-send"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Shows **bold** text from Gemini as real bold. Everything else stays plain text. */
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part.replace(/^\* /gm, "• ")}</span>
        )
      )}
    </>
  );
}

/** Shows each tool call so users (and judges) can see what the agent did. */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="tool-steps">
      {steps.map((s, i) => (
        <details key={i} className="tool-step">
          <summary className="tool-step-summary">
            <span className={s.ok ? "tool-step-success" : "tool-step-failure"}>{s.ok ? "Done" : "Failed"}</span>
            {" · "}
            <span className="tool-step-name">{s.tool}</span>
            {s.writes && <span className="tool-step-write">writes data</span>}
          </summary>
          <pre className="tool-step-output">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}
