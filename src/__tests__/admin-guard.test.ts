import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth-guard and prisma
vi.mock("@/lib/auth-guard", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getCurrentSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  validateAdminUserMutation,
} from "../lib/admin-guard";
import { Role } from "@prisma/client";

describe("Phase 6: Admin Security Guard & Mutation Safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateAdminUserMutation Self-Lockout Guards", () => {
    it("should BLOCK an admin from banning their own account", () => {
      const result = validateAdminUserMutation({
        actorId: "admin_123",
        targetUserId: "admin_123",
        nextIsBanned: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("امکان مسدودسازی حساب مدیریت فعال شما توسط خودتان وجود ندارد");
    });

    it("should BLOCK an admin from demoting their own account to USER", () => {
      const result = validateAdminUserMutation({
        actorId: "admin_123",
        targetUserId: "admin_123",
        nextRole: Role.USER,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("امکان تنزل رتبه حساب مدیریت خود به کاربر عادی وجود ندارد");
    });

    it("should ALLOW an admin to update another user (role change or ban)", () => {
      const banResult = validateAdminUserMutation({
        actorId: "admin_123",
        targetUserId: "user_456",
        nextIsBanned: true,
      });
      expect(banResult.valid).toBe(true);

      const demoteResult = validateAdminUserMutation({
        actorId: "admin_123",
        targetUserId: "user_456",
        nextRole: Role.USER,
      });
      expect(demoteResult.valid).toBe(true);
    });

    it("should ALLOW self-update when not banning or demoting", () => {
      const result = validateAdminUserMutation({
        actorId: "admin_123",
        targetUserId: "admin_123",
        nextRole: Role.ADMIN,
        nextIsBanned: false,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("requireAdmin Authorization Check", () => {
    it("should return 401 when no session exists", async () => {
      (getCurrentSession as any).mockResolvedValue(null);

      const result = await requireAdmin();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(401);
    });

    it("should return 403 when session user is not an ADMIN", async () => {
      (getCurrentSession as any).mockResolvedValue({ userId: "user_normal", role: "USER" });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_normal",
        role: Role.USER,
        isBanned: false,
      });

      const result = await requireAdmin();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(403);
    });

    it("should return 403 when user is an ADMIN but is marked as BANNED", async () => {
      (getCurrentSession as any).mockResolvedValue({ userId: "admin_banned", role: "ADMIN" });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin_banned",
        role: Role.ADMIN,
        isBanned: true,
      });

      const result = await requireAdmin();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(403);
    });

    it("should return admin user object when user is authenticated, unbanned ADMIN", async () => {
      const mockAdmin = {
        id: "admin_valid",
        name: "مدیر کل",
        phone: "09120000000",
        role: Role.ADMIN,
        isBanned: false,
      };

      (getCurrentSession as any).mockResolvedValue({ userId: "admin_valid", role: "ADMIN" });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);

      const result = await requireAdmin();
      expect(result.error).toBeUndefined();
      expect(result.admin).toBeDefined();
      expect(result.admin?.id).toBe("admin_valid");
    });
  });
});
