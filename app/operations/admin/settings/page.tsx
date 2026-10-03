import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await requireOperationsUser();
  if (session.user.role !== "SUPER_ADMIN") redirect("/operations");
  const [settings, categories] = await Promise.all([db.systemSetting.findUnique({ where: { id: "main" } }), db.assetCategory.findMany({ orderBy: { name: "asc" } })]);
  return <main className="simple-page"><div className="heading-row"><div><h1>Categories and system rules</h1><p className="muted">Configure asset categories and default review deadlines.</p></div><Link className="outline-button" href="/operations/admin">Employee access</Link></div><SettingsForm settings={settings ?? { highValueThreshold: 1000000, defaultPaymentHours: 48, defaultPickupDays: 7 }} categories={categories} /></main>;
}
