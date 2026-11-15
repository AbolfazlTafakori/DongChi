import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  isValidInviteCode,
  serializeBigInt,
} from "../lib/serialize";

describe("Group Utilities & Serialization", () => {
  describe("generateInviteCode & isValidInviteCode", () => {
    it("should generate valid 8-character invite codes", () => {
      const code = generateInviteCode();
      expect(typeof code).toBe("string");
      expect(code.length).toBe(8);
      expect(isValidInviteCode(code)).toBe(true);
    });

    it("should validate correct invite code formats", () => {
      expect(isValidInviteCode("AB34CD78")).toBe(true);
      expect(isValidInviteCode("12345678")).toBe(true);
      expect(isValidInviteCode("abcdefgh")).toBe(true);
    });

    it("should reject invalid invite codes", () => {
      expect(isValidInviteCode("SHORT")).toBe(false);
      expect(isValidInviteCode("TOOLONG123")).toBe(false);
      expect(isValidInviteCode("AB12-345")).toBe(false);
      expect(isValidInviteCode("")).toBe(false);
    });
  });

  describe("serializeBigInt", () => {
    it("should convert primitive BigInt to string", () => {
      expect(serializeBigInt(50000n)).toBe("50000");
      expect(serializeBigInt(0n)).toBe("0");
      expect(serializeBigInt(-100n)).toBe("-100");
    });

    it("should recursively convert BigInts in nested objects and arrays", () => {
      const input = {
        title: "گروه تست",
        balance: 150000n,
        nested: {
          owed: 50000n,
          items: [1000n, 2000n, "fixed"],
        },
        isActive: true,
        count: 5,
        emptyVal: null,
      };

      const serialized = serializeBigInt(input);
      expect(serialized).toEqual({
        title: "گروه تست",
        balance: "150000",
        nested: {
          owed: "50000",
          items: ["1000", "2000", "fixed"],
        },
        isActive: true,
        count: 5,
        emptyVal: null,
      });
    });

    it("should handle null and undefined safely", () => {
      expect(serializeBigInt(null)).toBeNull();
      expect(serializeBigInt(undefined)).toBeUndefined();
    });
  });
});
