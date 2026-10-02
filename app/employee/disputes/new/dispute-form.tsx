"use client";
import { FormEvent, useState } from "react";

export default function DisputeForm({ auctions, selectedId }: { auctions: { id: string; title: string; reference: string }[]; selectedId: string }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const response = await fetch("/api/workflow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createDispute", auctionId: data.get("auctionId"), reason: data.get("reason"), detail: data.get("detail") }) });
    const result = await response.json(); setMessage(response.ok ? "Dispute submitted to Compliance." : result.error ?? "Could not submit dispute.");
    if (response.ok) event.currentTarget.reset();
  }
  return <form className="listing-form" onSubmit={(event) => void submit(event)}><label>Auction<select name="auctionId" defaultValue={selectedId} required><option value="">Select an auction</option>{auctions.map((item) => <option value={item.id} key={item.id}>{item.reference} · {item.title}</option>)}</select></label><label>Reason<input name="reason" required minLength={3} maxLength={120} /></label><label>What happened?<textarea name="detail" required minLength={10} maxLength={2000} /></label><button className="primary-button">Submit dispute</button>{message && <p role="status">{message}</p>}</form>;
}
