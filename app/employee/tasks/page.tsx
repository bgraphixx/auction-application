import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/require-user";
import EmployeeTasks from "./tasks-client";

export default async function TasksPage() {
  const session = await requireUser();
  const approvals = await db.winnerApproval.findMany({ where: { bidderId: session.user.id, approved: true }, include: { auction: { include: { payment: true, pickup: true } } } });
  const bids = await db.bid.findMany({ where: { bidderId: session.user.id }, include: { auction: true }, orderBy: { createdAt: "desc" }, take: 10 });
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/employee/dashboard">← Employee workspace</Link></header><EmployeeTasks approvals={approvals.map((approval) => ({ auctionId: approval.auctionId, title: approval.auction.title, state: approval.auction.state, paymentStatus: approval.auction.payment?.status ?? "PENDING", pickupStatus: approval.auction.pickup?.status ?? "PENDING", pickupAt: approval.auction.pickup?.scheduledAt?.toISOString() ?? null, acknowledged: Boolean(approval.auction.pickup?.acknowledgedAt), paymentDeadline: approval.auction.paymentDeadline.toISOString(), pickupDeadline: approval.auction.pickupDeadline.toISOString(), paymentRules: approval.auction.paymentRules }))} bids={bids.map((bid) => ({ auctionId: bid.auctionId, title: bid.auction.title, amount: bid.amount, state: bid.auction.state }))} /> </main>;
}
