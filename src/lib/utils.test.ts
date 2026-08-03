import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and resolves conflicts", () => {
    const result = cn("p-2", "p-4", "text-sm");
    expect(result).toBe("p-4 text-sm");
  });
});
