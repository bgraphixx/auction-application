"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { name: string; description: string | null; active: boolean; bundleAllowed: boolean };
export default function SettingsForm({ settings, categories }: { settings: { highValueThreshold: number; defaultPaymentHours: number; defaultPickupDays: number }; categories: Category[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  async function save(payload: Record<string, unknown>) {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not save. Your entries are unchanged.");
      setMessage(payload.kind === "settings" ? "System settings saved." : "Category saved."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reach the server. Please retry."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>, kind: string) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (kind === "settings") void save({ kind, highValueThreshold: Number(data.get("highValueThreshold")), defaultPaymentHours: Number(data.get("defaultPaymentHours")), defaultPickupDays: Number(data.get("defaultPickupDays")) });
    else void save({ kind, name: String(data.get("name")).trim(), description: String(data.get("description")).trim(), active: data.get("active") === "on", bundleAllowed: ["Inventory", "Scrap"].includes(categoryName) });
  }
  return <>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="save-notice" role="status">{message}</p>}<div className="workspace-columns"><section className="workspace-panel"><form onSubmit={(event) => submit(event, "settings")}><fieldset className="decision-form" disabled={busy}><legend>System rules</legend><label>High-value sensitive threshold (₦)<input name="highValueThreshold" type="number" min="1" step="1" required defaultValue={settings.highValueThreshold} /></label><p className="muted">Listings at or above this value require sensitive-asset review.</p><div className="two-column"><label>Default payment window (hours)<input name="defaultPaymentHours" type="number" min="1" max="720" required defaultValue={settings.defaultPaymentHours} /></label><label>Default pickup window (days)<input name="defaultPickupDays" type="number" min="1" max="365" required defaultValue={settings.defaultPickupDays} /></label></div><button className="primary-button">{busy ? "Saving…" : "Save system rules"}</button></fieldset></form></section><section className="workspace-panel"><h2>Category rules</h2><p className="muted">Active categories are available in the listing editor. Inventory and Scrap support lots; other categories contain single assets.</p><p className="muted">Changes are recorded in the audit trail.</p></section></div><div className="workspace-columns recent-bids"><section className="workspace-panel"><div className="panel-heading"><h2>Categories</h2><button className="outline-button" disabled={busy} onClick={() => { setSelected(null); setCategoryName(""); }}>Add category</button></div><div className="activity-list">{categories.map((item) => <article className="activity-row" key={item.name}><div><strong>{item.name}</strong><span>{item.active ? "Active" : "Inactive"} · {item.bundleAllowed ? "Lots allowed" : "Single assets"}</span><small>{item.description}</small></div><div className="action-row"><button className="outline-button" disabled={busy} onClick={() => { setSelected(item); setCategoryName(item.name); }}>Edit<span className="sr-only"> {item.name}</span></button><button className="outline-button" disabled={busy} onClick={() => void save({ kind: "category", ...item, description: item.description ?? "", active: !item.active })}>{item.active ? "Deactivate" : "Activate"}<span className="sr-only"> {item.name}</span></button></div></article>)}</div>{!categories.length && <p className="empty-copy">Add your first asset category.</p>}</section><section className="workspace-panel"><form key={selected?.name ?? "new"} onSubmit={(event) => submit(event, "category")}><fieldset className="decision-form" disabled={busy}><legend>{selected ? `Edit ${selected.name}` : "Add category"}</legend><label>Name<input name="name" required minLength={2} maxLength={50} value={categoryName} readOnly={Boolean(selected)} onChange={event => setCategoryName(event.target.value)} /></label><label>Description<textarea name="description" maxLength={500} defaultValue={selected?.description ?? ""} /></label><label className="check-label"><input name="active" type="checkbox" defaultChecked={selected?.active ?? true} /> Active</label><p className="muted">{["Inventory", "Scrap"].includes(categoryName) ? "Lots are enabled for this category." : "This category supports single assets."}</p><button className="primary-button">{busy ? "Saving…" : "Save category"}</button></fieldset></form></section></div></>;
}
