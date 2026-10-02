import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import PickupActions from "./pickup-actions";
import { canPerform } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function PickupsPage() {
  const session = await requireOperationsUser();
  if (!canPerform(session.user.role, "FACILITIES")) redirect("/operations");
  const pickups = await db.pickup.findMany({ where: { auction: { state: { in: ["PAID", "PICKUP_SCHEDULED", "PICKED_UP"] } } }, include: { auction: true }, orderBy: { auction: { pickupDeadline: "asc" } } });
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="form-page"><p className="eyebrow">FACILITIES</p><h1>Pickup scheduling and handover</h1><div className="queue-list">{pickups.length === 0 ? <p className="empty-copy">No paid assets require pickup handling.</p> : pickups.map((pickup) => <article className="stacked-card" key={pickup.id}><div><b>{pickup.auction.title}</b><span>{pickup.status === "SCHEDULED" ? `Scheduled ${pickup.scheduledAt?.toLocaleString()}` : pickup.status === "COMPLETED" ? `Handover recorded ${pickup.completedAt?.toLocaleString()}` : "Ready to schedule"}</span><span>{pickup.auction.location} · {pickup.auction.reference}</span></div><PickupActions auctionId={pickup.auctionId} status={pickup.status} deadline={pickup.auction.pickupDeadline.toISOString()} /></article>)}</div></section></main>;
}
