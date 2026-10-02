import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import { WorkflowButton } from "@/components/workflow-button";
import { canPerform } from "@/lib/permissions";

export default async function ListingsPage() {
  const session = await requireOperationsUser();
  const listings = await db.auction.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const editable = canPerform(session.user.role, "AUCTION_ADMIN");
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="form-page"><p className="eyebrow">AUCTION LISTINGS</p><div className="heading-row"><h1>Listings</h1>{editable && <Link href="/operations/listings/new" className="primary-button">Create listing</Link>}</div><div className="queue-list">{listings.length === 0 ? <p className="empty-copy">No listings yet.</p> : listings.map((listing) => <article key={listing.id}><div><b>{listing.title}</b><span>{listing.reference} · {listing.state.replaceAll("_", " ")} · ₦{listing.startingPrice.toLocaleString()} · {listing.photoKeys.length} photos</span></div><div className="action-row">{editable && listing.state === "DRAFT" && <><Link className="outline-button" href={`/operations/listings/${listing.id}/edit`}>Edit</Link><WorkflowButton payload={{ action: "submitListing", auctionId: listing.id }}>Submit for approval</WorkflowButton></>}{editable && listing.state === "PENDING_APPROVAL" && <WorkflowButton payload={{ action: "publish", auctionId: listing.id }}>Approve & publish</WorkflowButton>}{editable && ["DRAFT", "PENDING_APPROVAL", "LIVE", "HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING"].includes(listing.state) && <WorkflowButton payload={{ action: "cancelAuction", auctionId: listing.id }} prompt="Cancellation reason (minimum 10 characters)">Cancel</WorkflowButton>}</div></article>)}</div></section></main>;
}
