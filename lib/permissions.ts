export const operationalRoles = ["AUCTION_ADMIN", "FINANCE", "FACILITIES", "COMPLIANCE", "SUPER_ADMIN"] as const;
export type OperationalRole = typeof operationalRoles[number];

export function canUseOperations(role: string) {
  return operationalRoles.includes(role as OperationalRole);
}
