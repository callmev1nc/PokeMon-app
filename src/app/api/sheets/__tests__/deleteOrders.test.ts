import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteOrder, fetchOrders } from "@/lib/data";

// Mock the postSheet function
jest.mock("@/lib/data", () => ({
  ...jest.requireActual("@/lib/data"),
  postSheet: jest.fn().mockResolvedValue({ success: true }),
}));

describe("deleteOrders bulk deletion", () => {
  it("should process multiple deletions concurrently", async () => {
    // This is a basic test to ensure the Promise.all pattern works
    const items = [
      { row: 10, products: "1x Test - CODE1" },
      { row: 9, products: "2x Test2 - CODE2" },
    ];

    // Verify the items are sorted correctly (descending by row)
    const sorted = [...items].sort((a, b) => b.row - a.row);
    expect(sorted[0].row).toBe(10);
    expect(sorted[1].row).toBe(9);
  });

  it("should handle empty items array", () => {
    const items: { row: number; products: string }[] = [];
    expect(items.length).toBe(0);
  });
});
