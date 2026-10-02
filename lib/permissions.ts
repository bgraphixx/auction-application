export const operationalRoles = ["AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE", "SUPER_ADMIN"] as const;
export type OperationalRole = typeof operationalRoles[number];

export function canUseOperations(role: string) {
  return operationalRoles.includes(role as OperationalRole);
}

export function canPerform(role: string, area: "AUCTION_ADMIN" | "FINANCE" | "FACILITIES" | "COMPLIANCE" | "SUPER_ADMIN") {
  return role === "SUPER_ADMIN" || role === area;
}
