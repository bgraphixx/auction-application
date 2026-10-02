import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.discriminatedUnion("kind", [z.object({ kind: z.literal("settings"), highValueThreshold: z.number().int().positive(), defaultPaymentHours: z.number().int().min(1).max(720), defaultPickupDays: z.number().int().min(1).max(365) }), z.object({ kind: z.literal("category"), name: z.string().min(2).max(50), description: z.string().max(500).optional(), active: z.boolean(), bundleAllowed: z.boolean() })]);
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "SUPER_ADMIN") return Response.json({ error: "Super Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid settings." }, { status: 400 });
  const values = parsed.data;
  if (values.kind === "settings") {
    const before = await db.systemSetting.findUnique({ where: { id: "main" } });
    await db.$transaction([db.systemSetting.upsert({ where: { id: "main" }, update: { highValueThreshold: values.highValueThreshold, defaultPaymentHours: values.defaultPaymentHours, defaultPickupDays: values.defaultPickupDays }, create: { id: "main", highValueThreshold: values.highValueThreshold, defaultPaymentHours: values.defaultPaymentHours, defaultPickupDays: values.defaultPickupDays } }), db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "SETTINGS_UPDATED", before: before ? { highValueThreshold: before.highValueThreshold, defaultPaymentHours: before.defaultPaymentHours, defaultPickupDays: before.defaultPickupDays } : undefined, after: values } })]);
  } else {
    const existing = await db.assetCategory.findUnique({ where: { name: values.name } });
    if (!values.bundleAllowed && ["Inventory", "Scrap"].includes(values.name)) return Response.json({ error: "Inventory and scrap lots require bundle support." }, { status: 400 });
    if (values.bundleAllowed && !["Inventory", "Scrap"].includes(values.name)) return Response.json({ error: "Lots are only supported for inventory and scrap." }, { status: 400 });
    await db.$transaction([db.assetCategory.upsert({ where: { name: values.name }, update: { description: values.description, active: values.active, bundleAllowed: values.bundleAllowed }, create: { name: values.name, description: values.description, active: values.active, bundleAllowed: values.bundleAllowed } }), db.auditEvent.create({ data: { actorId: session.user.id, actorRole: session.user.role, action: "CATEGORY_UPDATED", before: existing ? { active: existing.active, description: existing.description } : undefined, after: values } })]);
  }
  return Response.json({ ok: true });
}
