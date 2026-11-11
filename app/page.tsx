"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import TaskList from "@/components/TaskList";

/*
 * HOME PAGE
 * Left: the agent chat. Right: the data the agent works on (here: tasks).
 * YOUR JOB: replace TaskList with your own data view (orders, tickets, claims, ...)
 * and add more pages under app/ (for example app/orders/page.tsx).
 */
export default function HomePage() {
  // Changes every time the agent writes data, so the list on the right reloads.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Hackathon Starter</h1>
          <p className="dashboard-subtitle">Replace this with your app name and problem statement.</p>
        </div>
        <button onClick={logout} className="logout-button">
          Log out
        </button>
      </header>
      <div className="dashboard-grid">
        <section className="dashboard-column dashboard-chat-column">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="dashboard-column dashboard-tasks-column">
          <TaskList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
