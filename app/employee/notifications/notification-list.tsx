"use client";
import { useState } from "react";

type Notice = { id: string; title: string; body: string; createdAt: string; readAt: string | null; emailedAt: string | null };
export default function NotificationList({ notices: initial }: { notices: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  async function markRead(id: string) { const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (response.ok) setNotices((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); }
  return <div className="queue-list">{notices.length ? notices.map((item) => <article key={item.id}><div><b>{item.title}</b><span>{new Date(item.createdAt).toLocaleString()} · {item.emailedAt ? "Email sent" : "In app"}</span><p>{item.body}</p></div>{!item.readAt && <button className="outline-button" onClick={() => void markRead(item.id)}>Mark read</button>}</article>) : <div className="empty-state"><span className="empty-icon">📭</span><h3>No notifications yet</h3><p>We'll alert you about bid updates, approvals, and pickup details.</p><a className="outline-button" href="/employee/auctions">Browse auctions</a></div>}</div>;
}
