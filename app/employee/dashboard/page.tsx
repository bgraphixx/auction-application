import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { canUseOperations } from "@/lib/permissions";

export default async function EmployeeDashboard() {
  const session = await requireUser();
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><div><span>{session.user.name}</span><b>{session.user.role.replaceAll("_", " ")}</b></div></header><section className="dashboard-hero"><p className="eyebrow">EMPLOYEE WORKSPACE</p><h1>Good morning, {session.user.name.split(" ")[0]}.</h1><p>Everything you need to buy, pay for, and collect company assets.</p><div className="dashboard-actions"><Link className="primary-button" href="/employee/auctions">Browse live auctions</Link><Link className="outline-button" href="/employee/tasks">My activity</Link>{canUseOperations(session.user.role) && <Link className="outline-button" href="/operations">Open operations workspace</Link>}</div></section><section className="dashboard-grid"><article><span>LIVE</span><h2>Live auctions</h2><p>Browse eligible company assets and submit anonymous bids.</p><Link href="/employee/auctions">View auctions →</Link></article><article><span>MY BIDS</span><h2>Bid activity</h2><p>Track highest bids, review state, and outcome updates.</p><Link href="/employee/tasks">Check your bids →</Link></article><article><span>NEXT ACTION</span><h2>Payments & pickups</h2><p>Upload payment proof and view confirmed collection details.</p><Link href="/employee/tasks">View status →</Link></article></section></main>;
}
