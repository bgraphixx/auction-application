import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import DisputeForm from "./dispute-form";

export default async function NewDisputePage({ searchParams }: { searchParams: Promise<{ auctionId?: string }> }) {
  await requireUser();
  const { auctionId } = await searchParams;
  const auctions = await db.auction.findMany({ where: { state: { not: "DRAFT" } }, select: { id: true, title: true, reference: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/employee/dashboard">← Employee workspace</Link></header><section className="form-page"><p className="eyebrow">DISPUTES & APPEALS</p><h1>Submit a dispute</h1><DisputeForm auctions={auctions} selectedId={auctionId ?? ""} /></section></main>;
}
