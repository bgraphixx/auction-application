import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOperationsUser } from "@/lib/require-user";
import { db } from "@/lib/db";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await requireOperationsUser();
  if (session.user.role !== "SUPER_ADMIN") redirect("/operations");
  const [settings, categories] = await Promise.all([db.systemSetting.findUnique({ where: { id: "main" } }), db.assetCategory.findMany({ orderBy: { name: "asc" } })]);
  return <main className="simple-page"><header className="simple-header"><img src="/assets/ffcl_logo_full.png" alt="Fewchore" /><Link href="/operations/admin">← Administration</Link></header><section className="form-page"><p className="eyebrow">SUPER ADMIN</p><h1>Categories and settings</h1><SettingsForm settings={settings ?? { highValueThreshold: 1000000, defaultPaymentHours: 48, defaultPickupDays: 7 }} categories={categories} /></section></main>;
}
