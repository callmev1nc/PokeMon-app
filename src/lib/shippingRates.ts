/**
 * Calculate shipping cost based on delivery address and order value.
 * Order value is in the same unit as sellPrice (full VND).
 *
 * - Free shipping for orders >= 500,000 VND
 * - Major cities (Ha Noi, HCM): 20,000 VND
 * - Other areas: 30,000 VND
 */
export function calculateShipping(address: string, orderValue: number): number {
  if (orderValue >= 500000) return 0;
  if (!address) return 30000;
  const lower = address.toLowerCase();
  if (
    lower.includes("hà nội") ||
    lower.includes("ha noi") ||
    lower.includes("hcm") ||
    lower.includes("hồ chí minh")
  ) {
    return 20000;
  }
  return 30000;
}
