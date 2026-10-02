import AcceptInviteForm from "./form";

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  return <AcceptInviteForm email={params.email ?? ""} />;
}
