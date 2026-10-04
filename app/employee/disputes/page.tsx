import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import { dateTime, stateLabel } from "@/lib/presentation";

export default async function DisputesPage() {
  const session = await requireUser();
  const disputes = await db.dispute.findMany({
    where: { reporterId: session.user.id },
    select: { id: true, reason: true, status: true, createdAt: true, evidenceKey: true, auction: { select: { title: true, reference: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="simple-page">
      <div className="heading-row">
        <div>
          <h1>Your disputes</h1>
          <p className="muted">Track concerns raised with Compliance.</p>
        </div>
        <Link className="primary-button" href="/employee/disputes/new">New dispute</Link>
      </div>

      <div className="workspace-panel" style={{ marginTop: "32px" }}>
        {disputes.length ? (
          <div className="activity-list">
            {disputes.map((dispute) => (
              <article className="activity-row" key={dispute.id}>
                <div>
                  <strong>{dispute.auction.title}</strong>
                  <span>{dispute.reason}</span>
                  <small>Submitted {dateTime(dispute.createdAt)} WAT</small>
                </div>
                <div className="activity-value">
                  <span className="listing-state">{stateLabel(dispute.status)}</span>
                  <small>{dispute.auction.reference}</small>
                  {dispute.evidenceKey && (
                    <a className="text-link" href={`/api/uploads/download?key=${encodeURIComponent(dispute.evidenceKey)}`} target="_blank" rel="noreferrer">
                      View evidence
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">⚖️</span>
            <h3>No disputes raised</h3>
            <p>If you encounter an issue with an auction, you can submit a dispute for Compliance review.</p>
            <Link className="outline-button" href="/employee/disputes/new">Submit a dispute</Link>
          </div>
        )}
      </div>
    </main>
  );
}
