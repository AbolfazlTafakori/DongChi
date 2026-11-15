import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  ensureAdminDatabaseSeeded,
  getAdminAccounts,
  findAdminByUsername,
  findAdminByPhone,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
  sanitizeAdmin,
} from "../lib/admin-db";
import {
  setUserPassword,
  getUserCredential,
  verifyUserPassword,
  hasUserPassword,
} from "../lib/user-credentials";
import { bridgeAdminToMainSiteUser } from "../lib/auth-bridge";
import { POST as loginPasswordHandler } from "../app/api/auth/login-password/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

describe("Dual-Database & Admin Identity Bridge Architecture Tests", () => {
  describe("1. Password Hashing & Verification (Scrypt / Zero-Native)", () => {
    it("should hash a password into the standard scrypt format", () => {
      const password = "mySecurePassword123";
      const hash = hashPassword(password);

      expect(typeof hash).toBe("string");
      expect(hash.startsWith("scrypt:")).toBe(true);

      const parts = hash.split(":");
      expect(parts.length).toBe(3);
      expect(parts[1].length).toBe(32); // 16 bytes hex = 32 chars
      expect(parts[2].length).toBe(128); // 64 bytes hex = 128 chars
    });

    it("should verify correct password successfully", () => {
      const password = "SuperSecretPassword2026";
      const hash = hashPassword(password);

      expect(verifyPassword(password, hash)).toBe(true);
    });

    it("should reject incorrect password", () => {
      const password = "SuperSecretPassword2026";
      const hash = hashPassword(password);

      expect(verifyPassword("WrongPassword", hash)).toBe(false);
      expect(verifyPassword("supersecretpassword2026", hash)).toBe(false);
    });

    it("should return false gracefully on corrupted or malformed hash inputs", () => {
      expect(verifyPassword("test", "corrupted_hash")).toBe(false);
      expect(verifyPassword("test", "")).toBe(false);
      expect(verifyPassword("test", "scrypt:invalid")).toBe(false);
      expect(verifyPassword("", "scrypt:123:456")).toBe(false);
    });
  });

  describe("2. Isolated Admin Database (admins-db.json)", () => {
    it("should auto-seed default super admin if database is initialized", async () => {
      const admins = await ensureAdminDatabaseSeeded();
      expect(admins.length).toBeGreaterThanOrEqual(1);

      const rootAdmin = admins.find((a) => a.role === "SUPER_ADMIN");
      expect(rootAdmin).toBeDefined();
      expect(rootAdmin?.isActive).toBe(true);
      expect(rootAdmin?.passwordHash.startsWith("scrypt:")).toBe(true);
    });

    it("should find admin by username case-insensitively and by phone", async () => {
      const accounts = await getAdminAccounts();
      const first = accounts[0];

      const foundByUpper = await findAdminByUsername(first.username.toUpperCase());
      expect(foundByUpper?.id).toBe(first.id);

      const foundByPhone = await findAdminByPhone(first.phone);
      expect(foundByPhone?.id).toBe(first.id);
    });

    it("should sanitize admin account removing passwordHash", async () => {
      const accounts = await getAdminAccounts();
      const sanitized = sanitizeAdmin(accounts[0]);

      expect(sanitized).not.toHaveProperty("passwordHash");
      expect(sanitized.id).toBe(accounts[0].id);
      expect(sanitized.username).toBe(accounts[0].username);
    });

    it("should create, update, and manage RBAC roles for admins", async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const username = `admin_finance_${uniqueSuffix}`;
      const phone = `0935${uniqueSuffix}1`;

      const newAdmin = await createAdminAccount({
        username,
        password: "financePass123",
        fullName: "مدیر مالی تستی",
        phone,
        role: "FINANCE_ADMIN",
      });

      expect(newAdmin.username).toBe(username);
      expect(newAdmin.role).toBe("FINANCE_ADMIN");
      expect(verifyPassword("financePass123", newAdmin.passwordHash)).toBe(true);

      // Update role and name
      const updated = await updateAdminAccount(newAdmin.id, {
        fullName: "مدیر مالی ارشد",
        role: "SUPER_ADMIN",
      });

      expect(updated.fullName).toBe("مدیر مالی ارشد");
      expect(updated.role).toBe("SUPER_ADMIN");

      // Prevent duplicate username
      await expect(
        createAdminAccount({
          username,
          password: "anotherPass123",
          fullName: "تکراری",
          phone: `0935${uniqueSuffix}2`,
          role: "SUPPORT_ADMIN",
        })
      ).rejects.toThrow("قبلاً برای مدیر دیگری ثبت شده است");
    });
  });

  describe("3. User Password Credentials (user-credentials.json)", () => {
    const testPhone = "09128887766";
    const testUserId = "usr_test_cred_123";

    it("should set and verify regular user password", async () => {
      await setUserPassword(testUserId, testPhone, "userSecret123");

      const hasPass = await hasUserPassword(testPhone);
      expect(hasPass).toBe(true);

      const isValid = await verifyUserPassword(testPhone, "userSecret123");
      expect(isValid).toBe(true);

      const isInvalid = await verifyUserPassword(testPhone, "wrongPass");
      expect(isInvalid).toBe(false);

      const cred = await getUserCredential(testPhone);
      expect(cred?.userId).toBe(testUserId);
      expect(cred?.phone).toBe(testPhone);
    });
  });

  describe("4. Identity Bridge (Admin Account -> PostgreSQL Shadow User)", () => {
    it("should bridge an AdminAccount to a PostgreSQL User with Role.ADMIN and valid session", async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const adminPhone = `0919${uniqueSuffix}9`;

      const testAdmin = {
        id: `admin_bridge_${uniqueSuffix}`,
        username: `bridge_admin_${uniqueSuffix}`,
        passwordHash: hashPassword("bridgePass123"),
        fullName: "مدیر پل ارتباطی",
        phone: adminPhone,
        role: "SUPER_ADMIN" as const,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { user, token } = await bridgeAdminToMainSiteUser(testAdmin);

      expect(user).toBeDefined();
      expect(user.phone).toBe(adminPhone);
      expect(user.role).toBe(Role.ADMIN);
      expect(user.isBanned).toBe(false);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);

      // Verify user in PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { phone: adminPhone },
      });
      expect(dbUser?.role).toBe(Role.ADMIN);
    });
  });

  describe("5. POST /api/auth/login-password (Dual Mode Authentication)", () => {
    it("should authenticate an admin via username and password and route to /admin", async () => {
      const admins = await getAdminAccounts();
      const admin = admins[0];

      // We know initial admin has password "admin123456" if seed, or let's update password
      await updateAdminAccount(admin.id, { password: "adminTestPass123" });

      const req = new NextRequest("http://localhost:3000/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: admin.username,
          password: "adminTestPass123",
          mode: "LOGIN",
        }),
      });

      const res = await loginPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.redirectUrl).toBe("/admin");
      expect(json.role).toBe("ADMIN");
      expect(res.cookies.get("session_token")).toBeDefined();
    });

    it("should reject admin login with invalid password", async () => {
      const admins = await getAdminAccounts();
      const admin = admins[0];

      const req = new NextRequest("http://localhost:3000/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: admin.username,
          password: "totallyWrongPassword",
          mode: "LOGIN",
        }),
      });

      const res = await loginPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toContain("اشتباه است");
    });

    it("should register a regular user with password and route to /app", async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const regPhone = `0911${uniqueSuffix}5`;

      const req = new NextRequest("http://localhost:3000/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "REGISTER",
          phone: regPhone,
          password: "userRegisterPass123",
          name: "کاربر جدید ثبت‌نامی",
        }),
      });

      const res = await loginPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.redirectUrl).toBe("/app");
      expect(json.user.phone).toBe(regPhone);
      expect(res.cookies.get("session_token")).toBeDefined();

      // Now verify that the registered user can login with their password
      const loginReq = new NextRequest("http://localhost:3000/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "LOGIN",
          identifier: regPhone,
          password: "userRegisterPass123",
        }),
      });

      const loginRes = await loginPasswordHandler(loginReq);
      const loginJson = await loginRes.json();

      expect(loginRes.status).toBe(200);
      expect(loginJson.success).toBe(true);
      expect(loginJson.redirectUrl).toBe("/app");
    });
  });
});
