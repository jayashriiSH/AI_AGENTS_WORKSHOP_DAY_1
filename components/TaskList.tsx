"use client";

import { useEffect, useState } from "react";

type Task = { id: number; title: string; due_date: string | null; status: string };

/*
 * EXAMPLE data view: reads GET /api/tasks.
 * YOUR JOB: copy this pattern for your own data (orders, tickets, claims, ...).
 */
export default function TaskList({ refreshKey }: { refreshKey: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tasks")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load tasks");
        setTasks(data.tasks);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  return (
    <div className="tasks-card">
      <div className="card-header">
        <h2 className="card-title">Tasks</h2>
        <p className="card-description">Live from Supabase. Updates when the agent changes data.</p>
      </div>
      <ul className="task-list">
        {error && <li className="task-error">{error}</li>}
        {!error && tasks.length === 0 && <li className="task-empty">No tasks yet.</li>}
        {tasks.map((t) => (
          <li key={t.id} className="task-row">
            <div className="task-main">
              <p className={`task-title ${t.status === "done" ? "task-title-done" : ""}`}>{t.title}</p>
              <p className="task-meta">#{t.id} · Due: {t.due_date ?? "no date"}</p>
            </div>
            <span className={`task-status ${t.status === "done" ? "task-status-done" : "task-status-open"}`}>
              {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
