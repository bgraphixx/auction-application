"use client";
import { FormEvent, useState } from "react";
import { stateLabel } from "@/lib/presentation";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; employeeId: string; jobGrade: string; department: string; location: string; role: string; status: string; employmentStatus: string };
const roles = ["EMPLOYEE", "AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE", "SUPER_ADMIN"];
export default function AdminUsers({ users, invitations }: { users: User[]; invitations: { email: string; name: string; usedAt: string | null }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const visible = users.filter(user => `${user.name} ${user.email} ${user.employeeId} ${user.department}`.toLowerCase().includes(query.toLowerCase()));
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); setBusy(true);
    const formElement = event.currentTarget;
    const values = Object.fromEntries(new FormData(formElement).entries());
    try {
      const response = await fetch("/api/admin/employees", { method: selected ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, ...(selected ? { id: selected.id } : {}) }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Could not save. Your entries are unchanged.");
      setMessage(selected ? "Profile updated." : "Invitation sent.");
      if (!selected) formElement.reset();
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reach the server. Please retry."); }
    finally { setBusy(false); }
  }
  return <><div className="workspace-columns people-columns"><section className="workspace-panel"><div className="panel-heading"><h2>Employees</h2><button className="outline-button" disabled={busy} onClick={() => { setSelected(null); setError(""); setMessage(""); }}>Invite employee</button></div><label className="people-search">Search employees<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, employee ID, or email" /></label><p className="muted">{visible.length} of {users.length} loaded profiles</p><div className="table-scroll" tabIndex={0} role="region" aria-label="Employee directory"><table className="data-table"><thead><tr><th>Employee</th><th>ID / grade</th><th>Department</th><th>Account</th><th>Action</th></tr></thead><tbody>{visible.map(user => <tr key={user.id} aria-selected={selected?.id === user.id}><td><strong>{user.name}</strong><small className="table-secondary">{user.email}</small></td><td>{user.employeeId || "—"}<small className="table-secondary">{user.jobGrade || "No grade"}</small></td><td>{user.department || "—"}</td><td>{stateLabel(user.status)}</td><td><button className="outline-button" disabled={busy} aria-label={`Edit ${user.name}`} onClick={() => { setSelected(user); setError(""); setMessage(""); }}>Edit</button></td></tr>)}</tbody></table></div>{!visible.length && <p className="empty-copy">No employees match this search.</p>}</section><section className="workspace-panel"><form key={selected?.id ?? "invite"} onSubmit={(event) => void submit(event)}><fieldset className="decision-form" disabled={busy}><legend>{selected ? `Edit ${selected.name}` : "Invite an employee"}</legend><div className="two-column"><label>Full name<input name="name" required defaultValue={selected?.name} /></label><label>Company email<input name="email" type="email" required defaultValue={selected?.email} /></label></div><div className="two-column"><label>Employee ID<input name="employeeId" required defaultValue={selected?.employeeId} /></label><label>Grade<input name="jobGrade" required defaultValue={selected?.jobGrade} /></label></div><div className="two-column"><label>Department<input name="department" required defaultValue={selected?.department} /></label><label>Location<input name="location" required defaultValue={selected?.location} /></label></div><div className="two-column"><label>Role<select name="role" defaultValue={selected?.role ?? "EMPLOYEE"}>{roles.map((role) => <option key={role} value={role}>{stateLabel(role)}</option>)}</select></label>{selected && <label>Account status<select name="status" defaultValue={selected.status}><option>ACTIVE</option><option>SUSPENDED</option></select></label>}</div><label>Employment status<select name="employmentStatus" defaultValue={selected?.employmentStatus ?? "ACTIVE"}><option>ACTIVE</option><option>ON_LEAVE</option><option>TERMINATED</option></select></label><div className="action-row"><button className="primary-button">{busy ? "Saving…" : selected ? "Save profile" : "Send invitation"}</button>{selected && <button className="outline-button" type="button" onClick={() => setSelected(null)}>Cancel</button>}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="save-notice" role="status">{message}</p>}</form></section></div><section className="workspace-panel recent-bids"><h2 className="section-heading">Invitations</h2><div className="audit-list">{invitations.map((invite) => <div key={`${invite.email}-${invite.usedAt}`}><b>{invite.name}</b><span>{invite.email} · {invite.usedAt ? "Accepted" : "Pending"}</span></div>)}{!invitations.length && <p className="muted">No invitations sent yet.</p>}</div></section></>;
}
