import { requireUser } from "@/lib/require-user";
import AuctionBrowser from "./auction-browser";

export default async function AuctionsPage() {
  await requireUser();
  return <AuctionBrowser />;
}
