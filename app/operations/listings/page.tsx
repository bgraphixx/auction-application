import Link from "next/link";
import { db } from "@/lib/db";
import { requireOperationsUser } from "@/lib/require-user";
import { WorkflowButton } from "@/components/workflow-button";
import { canPerform } from "@/lib/permissions";
import { money, dateTime, stateLabel } from "@/lib/presentation";

const states = ["DRAFT", "PENDING_APPROVAL", "LIVE", "HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING", "PAID", "PICKUP_SCHEDULED", "PICKED_UP", "CLOSED", "CANCELLED"] as const;
export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; state?: string; saved?: string }> }) {
  const session = await requireOperationsUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 140) : "";
  const state = states.find(state => state === params.state);
  const [listings, counts, settings] = await Promise.all([
    db.auction.findMany({ where: { ...(state ? { state } : {}), ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { reference: { contains: query, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.auction.groupBy({ by: ["state"], _count: { _all: true } }),
    db.systemSetting.findUnique({ where: { id: "main" } }),
  ]);
  const editable = canPerform(session.user.role, "AUCTION_ADMIN");
  return <main><div className="heading-row"><div><p className="eyebrow">Asset management</p><h1>Listings</h1></div>{editable && <Link href="/operations/listings/new" className="primary-button">Create listing</Link>}</div>
    {params.saved === "1" && <p className="save-notice" role="status">Draft saved. Review the listing before submitting it for approval.</p>}
    <form className="list-toolbar" role="search"><label>Search listings<input name="q" type="search" placeholder="Asset name or reference" defaultValue={query} /></label><label>Status<select name="state" defaultValue={state ?? ""}><option value="">All statuses</option>{states.map(value => <option key={value} value={value}>{stateLabel(value)} ({counts.find(item => item.state === value)?._count._all ?? 0})</option>)}</select></label><button className="outline-button">Apply filters</button>{(query || state) && <Link href="/operations/listings">Clear</Link>}</form>
    <p className="muted">{listings.length} {listings.length === 1 ? "listing" : "listings"}{listings.length === 100 ? " shown (latest 100)" : ""}</p>
    <div className="listing-rows">{listings.map(listing => {
      const missing = [listing.startingPrice >= (settings?.highValueThreshold ?? 1000000) && !listing.sensitive ? "Flag this high-value asset as sensitive" : null,!listing.photoKeys.length ? "Add at least one photo" : null, listing.category === "IT assets" && listing.sensitive && (!listing.itWipeConfirmed || !listing.wipeProofUrl) ? "Complete sensitive-asset checks" : null].filter(Boolean);
      return <article className="listing-row" key={listing.id}><div className="listing-thumb">{listing.photoKeys[0] ? <img src={`/api/uploads/download?key=${encodeURIComponent(listing.photoKeys[0])}`} alt={listing.title} /> : <span>No photo</span>}</div><div className="listing-identity"><strong>{listing.title}</strong><small>{listing.reference}</small><span>{listing.category} / {listing.location}</span><span className={`listing-state state-${listing.state.toLowerCase()}`}>{stateLabel(listing.state)}</span></div><div className="listing-price"><small>{listing.bidCount ? "Highest bid" : "Starting price"}</small><strong>{money(listing.currentBid || listing.startingPrice)}</strong><small>{listing.bidCount} bids</small><small>Closes {dateTime(listing.endsAt)}</small></div><div className="listing-actions">
        {editable && listing.state === "DRAFT" && <><Link className="outline-button" href={`/operations/listings/${listing.id}/edit`}>Edit draft</Link>{missing.length ? <p className="readiness-note">{missing.join(". ")}.</p> : <WorkflowButton payload={{ action: "submitListing", auctionId: listing.id }}>Submit for approval</WorkflowButton>}</>}
        {editable && listing.state === "PENDING_APPROVAL" && <WorkflowButton payload={{ action: "publish", auctionId: listing.id }}>Approve & publish</WorkflowButton>}
        {editable && listing.state === "HIGHEST_BID_PENDING_APPROVAL" && <Link className="outline-button" href="/operations/approvals">Review winner</Link>}
        {editable && ["DRAFT", "PENDING_APPROVAL", "LIVE", "HIGHEST_BID_PENDING_APPROVAL", "PAYMENT_PENDING"].includes(listing.state) && <WorkflowButton payload={{ action: "cancelAuction", auctionId: listing.id }} prompt="Cancellation reason (minimum 10 characters)">Cancel listing</WorkflowButton>}
      </div></article>;
    })}</div>{!listings.length && <section className="workspace-panel panel-empty"><h2>{query || state ? "No matching listings" : "No listings yet"}</h2><p>{query || state ? "Try another asset name or clear the status filter." : "Create a draft, add photos, and submit it for approval."}</p><Link className="outline-button" href={query || state ? "/operations/listings" : "/operations/listings/new"}>{query || state ? "Clear filters" : "Create listing"}</Link></section>}
  </main>;
}
