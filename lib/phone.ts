export function normalizeNigerianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.startsWith("234") && digits.length === 13) return digits;
  return null;
}

export function internalAccountEmail(employeeId: string) {
  return `staff-${Buffer.from(employeeId.trim()).toString("base64url").toLowerCase()}@accounts.fewchore.invalid`;
}
