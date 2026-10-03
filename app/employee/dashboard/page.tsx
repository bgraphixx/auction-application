import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import { money, dateTime, stateLabel } from "@/lib/presentation";

export default async function EmployeeDashboard() {
  const { user } = await requireUser();
  const now = new Date();
  const [bids, watchCount, wins, liveCount, profile] = await Promise.all([
    db.bid.findMany({ where: { bidderId: user.id }, distinct: ["auctionId"], include: { auction: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.watchlist.count({ where: { userId: user.id } }),
    db.winnerApproval.findMany({ where: { bidderId: user.id, approved: true, auction: { state: { in: ["PAYMENT_PENDING", "PAID", "PICKUP_SCHEDULED"] } } }, include: { auction: { include: { payment: true, pickup: true } } }, orderBy: { createdAt: "desc" } }),
    db.auction.count({ where: { state: "LIVE", startsAt: { lte: now }, endsAt: { gt: now } } }),
    db.user.findUnique({ where: { id: user.id }, select: { jobGrade: true, department: true, location: true, employmentStatus: true } }),
  ]);
  const payments = wins.filter(win => win.auction.state === "PAYMENT_PENDING" && win.auction.payment?.status !== "SUBMITTED");
  const pickups = wins.filter(win => ["PAID", "PICKUP_SCHEDULED"].includes(win.auction.state));
  const activeBids = await db.auction.count({ where: { state: "LIVE", endsAt: { gt: now }, bids: { some: { bidderId: user.id } } } });
  const next = [...payments].sort((a,b) => a.auction.paymentDeadline.getTime() - b.auction.paymentDeadline.getTime())[0] ?? pickups[0];
  return <main>
    <div className="heading-row"><div><p className="eyebrow">My workspace</p><h1>Hello, {user.name.split(" ")[0]}</h1></div><Link className="outline-button" href="/employee/auctions">Browse {liveCount} live auctions</Link></div>
    <section className="metric-grid" aria-label="Your auction summary">
      {([["Active bids", activeBids, "/employee/bids"], ["Watchlist", watchCount, "/employee/watchlist"], ["Payments due", payments.length, "/employee/payments"], ["Pickups", pickups.length, "/employee/pickups"]] as const).map(([label, count, href]) => <Link href={href} key={label}><span>{label}</span><strong>{count}</strong></Link>)}
    </section>
    <div className="workspace-columns"><section className="workspace-panel"><div className="panel-heading"><h2>My activity</h2><Link href="/employee/bids">View all</Link></div>
      {bids.length ? <div className="activity-list">{bids.map(bid => <Link className="activity-row" href="/employee/bids" key={bid.id}><div><strong>{bid.auction.title}</strong><span className="status-badge">{bid.auction.state === "LIVE" ? bid.amount === bid.auction.currentBid ? "Highest bid" : "Outbid" : stateLabel(bid.auction.state)}</span></div><div className="activity-value"><strong>{money(bid.amount)}</strong><small>{bid.auction.state === "LIVE" ? `Closes ${dateTime(bid.auction.endsAt)}` : stateLabel(bid.auction.state)}</small></div></Link>)}</div> : <div className="panel-empty"><h3>Your activity will appear here</h3><p>Browse company assets and place your first bid.</p><Link href="/employee/auctions" className="outline-button">Browse auctions</Link></div>}
    </section><aside className="support-column"><section className="next-action"><h2>Next action</h2>{next ? <><h3>{next.auction.title}</h3><p>{next.auction.state === "PAYMENT_PENDING" ? `${money(next.auction.currentBid)} due ${dateTime(next.auction.paymentDeadline)}` : next.auction.pickup?.scheduledAt ? `Pickup ${dateTime(next.auction.pickup.scheduledAt)}` : "Payment verified. Awaiting pickup scheduling."}</p><Link className="outline-button" href={next.auction.state === "PAYMENT_PENDING" ? "/employee/payments" : "/employee/pickups"}>{next.auction.state === "PAYMENT_PENDING" ? "Upload payment proof" : "View pickup details"}</Link></> : <p>No payments or pickups need your attention.</p>}</section>
      <section className="workspace-panel"><h2>Eligibility profile</h2><dl className="facts"><div><dt>Grade</dt><dd>{profile?.jobGrade ?? "Not set"}</dd></div><div><dt>Department</dt><dd>{profile?.department ?? "Not set"}</dd></div><div><dt>Location</dt><dd>{profile?.location ?? "Not set"}</dd></div><div><dt>Employment</dt><dd>{profile?.employmentStatus.toLowerCase().replaceAll("_", " ") ?? "Not set"}</dd></div></dl><p className="muted">Eligibility is checked for each auction.</p></section>
    </aside></div>
  </main>;
}
