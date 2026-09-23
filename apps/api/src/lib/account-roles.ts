export type PublicAccountType = "CLIENT" | "PROFESSIONAL";
export type PublicAccountRole = "CLIENT" | "PROFESSIONAL";

export function rolesForAccountType(
  accountType: PublicAccountType,
): PublicAccountRole[] {
  return accountType === "PROFESSIONAL"
    ? ["CLIENT", "PROFESSIONAL"]
    : ["CLIENT"];
}
