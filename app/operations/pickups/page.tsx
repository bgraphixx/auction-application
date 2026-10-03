import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import PickupActions from "./pickup-actions";
import { canPerform } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { dateTime } from "@/lib/presentation";

export default async function PickupsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "FACILITIES")) redirect("/operations");
  const { id } = await searchParams;
  const pickups = await db.pickup.findMany({ where: { auction: { state: { in: ["PAID", "PICKUP_SCHEDULED", "PICKED_UP"] } } }, include: { auction: { include: { approval: { include: { bidder: { select: { name: true, employeeId: true } } } } } } }, orderBy: { auction: { pickupDeadline: "asc" } } });
  const selected = pickups.find(pickup => pickup.id === id) ?? pickups[0];
  return <main><div className="heading-row"><div><p className="eyebrow">Facilities</p><h1>Pickups & handover</h1></div><span className="listing-state">{pickups.length} assets</span></div>{selected ? <div className="workspace-columns"><section className="workspace-panel"><h2>Pickup queue</h2><div className="activity-list">{pickups.map(pickup => <Link className={`activity-row ${pickup.id === selected.id ? "selected-record" : ""}`} href={`?id=${pickup.id}`} key={pickup.id} aria-current={pickup.id === selected.id ? "page" : undefined}><div><strong>{pickup.auction.title}</strong><span>{pickup.auction.approval?.bidder.name ?? "Employee not recorded"}</span><small>{pickup.auction.location}</small></div><div className="activity-value"><span className="listing-state">{pickup.status === "SCHEDULED" ? "Scheduled" : pickup.status === "COMPLETED" ? "Picked up" : pickup.status === "MISSED" ? "Missed pickup" : "Ready to schedule"}</span><small>{pickup.scheduledAt ? dateTime(pickup.scheduledAt) : `Due ${dateTime(pickup.auction.pickupDeadline)}`}</small></div></Link>)}</div></section><aside className="support-column"><section className="workspace-panel"><h2>{selected.auction.title}</h2><dl className="facts"><div><dt>Employee</dt><dd>{selected.auction.approval?.bidder.name ?? "Not recorded"}</dd></div><div><dt>Employee ID</dt><dd>{selected.auction.approval?.bidder.employeeId ?? "Not recorded"}</dd></div><div><dt>Location</dt><dd>{selected.auction.location}</dd></div><div><dt>Reference</dt><dd>{selected.auction.reference}</dd></div></dl><p className="muted">{selected.auction.pickupRules}</p>{selected.evidenceUrl && <a className="outline-button" href={`/api/uploads/download?key=${encodeURIComponent(selected.evidenceUrl)}`} target="_blank" rel="noreferrer">View handover evidence</a>}</section><section className="workspace-panel"><PickupActions key={`${selected.id}-${selected.status}`} auctionId={selected.auctionId} status={selected.status} deadline={selected.auction.pickupDeadline.toISOString()} /></section></aside></div> : <section className="workspace-panel panel-empty"><h2>No assets awaiting pickup</h2><p>Assets appear here after Finance verifies payment.</p></section>}</main>;
}
