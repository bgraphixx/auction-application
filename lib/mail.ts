type Email = { to: string; subject: string; html: string };

export async function sendEmail(message: Email) {
  const apiKey = process.env.ZEPTO_MAIL_API_KEY;
  const from = process.env.ZEPTO_MAIL_FROM;
  if (!apiKey || !from) throw new Error("ZeptoMail is not configured");

  const response = await fetch("https://cpaas.zoho.com/v1.1/email", {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: { address: from }, to: [{ email_address: { address: message.to } }], subject: message.subject, htmlbody: message.html }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ZeptoMail delivery failed (${response.status}): ${detail}`);
  }
}
