import { normalizeNigerianPhone } from "@/lib/phone";

type Sms = { to: string; text: string };

export async function sendSms(message: Sms) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;
  const baseUrl = process.env.TERMII_BASE_URL;
  if (!apiKey || !senderId || !baseUrl) throw new Error("Termii is not configured");

  const to = normalizeNigerianPhone(message.to);
  if (!to) throw new Error("A valid Nigerian mobile number is required for SMS delivery");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to,
      from: senderId,
      sms: message.text,
      type: "plain",
      channel: process.env.TERMII_CHANNEL ?? "dnd",
    }),
  });
  if (!response.ok) throw new Error(`Termii delivery failed (${response.status}): ${await response.text()}`);
}
