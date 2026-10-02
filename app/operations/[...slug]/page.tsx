import Link from "next/link";
import { requireOperationsUser } from "@/lib/require-user";

export default async function OperationsQueue({ params }: { params: Promise<{ slug: string[] }> }) {
  await requireOperationsUser();
  const { slug } = await params;
  const title = slug.join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations">← Operations workspace</Link></header><section className="dashboard-hero"><p className="eyebrow">OPERATIONS QUEUE</p><h1>{title}</h1><p>This protected queue is ready to be connected to the corresponding database records and role-specific actions.</p><Link href="/operations" className="outline-button">Back to queues</Link></section></main>;
}
