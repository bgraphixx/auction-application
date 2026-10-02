import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { canUseOperations } from "@/lib/permissions";

export default async function EmployeeDashboard() {
  const session = await requireUser();
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><div><span>{session.user.name}</span><b>{session.user.role.replaceAll("_", " ")}</b></div></header><section className="dashboard-hero"><p className="eyebrow">EMPLOYEE WORKSPACE</p><h1>Good morning, {session.user.name.split(" ")[0]}.</h1><p>Everything you need to buy, pay for, and collect company assets.</p><div className="dashboard-actions"><Link className="primary-button" href="/employee/auctions">Browse live auctions</Link>{canUseOperations(session.user.role) && <Link className="outline-button" href="/operations">Open operations workspace</Link>}</div></section><section className="dashboard-grid"><article><span>LIVE</span><h2>24 live auctions</h2><p>18 assets are currently eligible for you to bid on.</p><Link href="/employee/auctions">View auctions →</Link></article><article><span>MY BIDS</span><h2>1 active bid</h2><p>You are currently the highest bidder on a Dell Latitude 7420.</p><Link href="/employee/auctions">Check your bid →</Link></article><article><span>NEXT ACTION</span><h2>No payment due</h2><p>Payment instructions appear after a winning bid has been approved.</p><Link href="/employee/auctions">View status →</Link></article></section></main>;
}
