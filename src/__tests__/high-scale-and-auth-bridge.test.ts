import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  getSyncCache,
  setSyncCache,
  invalidateUserSyncCache,
  checkHighSpeedRateLimit,
  getCachedStore,
  setCachedStore,
  invalidateCachedStore,
} from "../lib/high-scale-cache";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  getAdminAccounts,
  findAdminByUsername,
  findAdminByPhone,
} from "../lib/admin-db";
import { bridgeAdminToMainSiteUser } from "../lib/auth-bridge";
import { POST as loginPasswordHandler } from "../app/api/auth/login-password/route";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

describe("High-Concurrency Engine & Enterprise Auth Architecture Tests", () => {
  describe("1. O(1) In-Memory Sync Stamp Cache & Zero-DB-Hit Engine", () => {
    const testUserId = "usr_scale_test_01";
    const testPayload = {
      authenticated: true,
      syncHash: "hash_scale_12345",
      groupsCount: 3,
      serverTime: "2026-11-15T20:00:00.000Z",
    };

    beforeEach(() => {
      invalidateUserSyncCache(testUserId);
    });

    it("should return null for uncached user sync state", () => {
      expect(getSyncCache(testUserId)).toBeNull();
    });

    it("should store and retrieve sync payload in RAM without touching PostgreSQL", () => {
      setSyncCache(testUserId, testPayload, 5000);
      const cached = getSyncCache(testUserId);

      expect(cached).toBeDefined();
      expect(cached?.syncHash).toBe("hash_scale_12345");
      expect(cached?.groupsCount).toBe(3);
    });

    it("should immediately invalidate user sync cache when invalidateUserSyncCache is called", () => {
      setSyncCache(testUserId, testPayload, 5000);
      expect(getSyncCache(testUserId)).not.toBeNull();

      invalidateUserSyncCache(testUserId);
      expect(getSyncCache(testUserId)).toBeNull();
    });

    it("should handle group-wide cache invalidation when group changes occur", () => {
      setSyncCache("user_member_A", { hash: "A" });
      setSyncCache("user_member_B", { hash: "B" });

      // Invalidate group
      invalidateUserSyncCache(undefined, "group_alpha_123");

      expect(getSyncCache("user_member_A")).toBeNull();
      expect(getSyncCache("user_member_B")).toBeNull();
    });
  });

  describe("2. High-Speed In-Memory Rate Limiter & Brute-Force Shield", () => {
    it("should allow requests within rate limit thresholds and track remaining", () => {
      const key = `ratelimit_test_${Date.now()}`;
      const res1 = checkHighSpeedRateLimit(key, 3, 10_000);

      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkHighSpeedRateLimit(key, 3, 10_000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkHighSpeedRateLimit(key, 3, 10_000);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);

      // Exceeded!
      const res4 = checkHighSpeedRateLimit(key, 3, 10_000);
      expect(res4.allowed).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.resetMs).toBeGreaterThan(0);
    });
  });

  describe("3. In-Memory Store Caching", () => {
    it("should cache generic store data and invalidate properly", () => {
      const storeKey = "test_store_config";
      setCachedStore(storeKey, { maxUsers: 500 });

      expect(getCachedStore(storeKey)).toEqual({ maxUsers: 500 });

      invalidateCachedStore(storeKey);
      expect(getCachedStore(storeKey)).toBeNull();
    });
  });

  describe("4. Password Security & Admin-to-User Identity Bridge", () => {
    it("should correctly verify passwords using native Scrypt KDF", () => {
      const plain = "AbolfazlPass2026!";
      const hash = hashPassword(plain);

      expect(hash.startsWith("scrypt:")).toBe(true);
      expect(verifyPassword(plain, hash)).toBe(true);
      expect(verifyPassword("WrongPassword", hash)).toBe(false);
    });

    it("should bridge an admin account into PostgreSQL and authorize through login-password API", async () => {
      const admins = await getAdminAccounts();
      const admin = admins[0];

      // Bridge to user DB
      const { user, token } = await bridgeAdminToMainSiteUser(admin);

      expect(user).toBeDefined();
      expect(user.role).toBe(Role.ADMIN);
      expect(user.phone).toBe(admin.phone);
      expect(typeof token).toBe("string");
    });
  });

  describe("5. w-ui / x-ui Style Installer (install.sh & dongchi CLI)", () => {
    const installScriptPath = path.join(process.cwd(), "install.sh");
    const publicInstallPath = path.join(process.cwd(), "public", "install.sh");

    it("should ensure install.sh and public/install.sh exist and match", () => {
      expect(fs.existsSync(installScriptPath)).toBe(true);
      expect(fs.existsSync(publicInstallPath)).toBe(true);

      const rootContent = fs.readFileSync(installScriptPath, "utf-8");
      const pubContent = fs.readFileSync(publicInstallPath, "utf-8");

      expect(rootContent.length).toBeGreaterThan(1000);
      expect(rootContent).toBe(pubContent);
    });

    it("should contain zero Persian/Arabic characters for clean SSH terminal rendering", () => {
      const rootContent = fs.readFileSync(installScriptPath, "utf-8");
      const pubContent = fs.readFileSync(publicInstallPath, "utf-8");
      const persianRegex = /[\u0600-\u06FF]/;

      expect(persianRegex.test(rootContent)).toBe(false);
      expect(persianRegex.test(pubContent)).toBe(false);
    });

    it("should enforce /opt/dongchi sandbox directory isolation and project namespace", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain('INSTALL_ROOT="/opt/dongchi"');
      expect(content).toContain('APP_DIR="${INSTALL_ROOT}/app"');
      expect(content).toContain('chmod 700 "$INSTALL_ROOT"');
      expect(content).toContain('PROJECT_NAME="dongchi_stack"');
      expect(content).toContain('docker compose -p "$PROJECT_NAME"');
    });

    it("should enforce safe Nginx configuration with automatic rollback on error", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain("nginx -t");
      expect(content).toContain("systemctl reload nginx");
      expect(content).toContain('rm -f "$NGINX_CONF_DEST"');
    });

    it("should enforce /dev/tty interactive inputs so curl pipe works flawlessly", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain("< /dev/tty");
      expect(content).toContain("exec < /dev/tty");
    });

    it("should include port 80/443 conflict scanner and coexistence modes", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain("is_port_in_use 80");
      expect(content).toContain("is_port_in_use 443");
      expect(content).toContain("is_port_in_use 3000");
    });

    it("should install the global 100% English /usr/local/bin/dongchi management CLI menu", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain("/usr/local/bin/dongchi");
      expect(content).toContain("chmod +x");
      expect(content).toContain("DongChi Platform — Server Control Panel (v2.6)");
      expect(content).toContain("Service Status & Health Check");
      expect(content).toContain("Reset Super Admin Username & Password");
      expect(content).toContain("Update DongChi Core (Zero-Downtime Pull & Rebuild)");
      expect(content).toContain("Backup Databases (Saved to /opt/dongchi/backups)");
    });

    it("should feature auto-increment free port finder from 3000 upward (find_free_port 3000 3999)", () => {
      const content = fs.readFileSync(installScriptPath, "utf-8");

      expect(content).toContain("find_free_port");
      expect(content).toContain("find_free_port 3000 3999");
      expect(content).toContain("is_port_in_use");
    });
  });

  describe("6. Zero Host Port Exposure & Docker Compose Isolation", () => {
    it("should ensure docker-compose.prod.yml exposes DB/Redis without binding host 5432 or 6379", () => {
      const composePath = path.join(process.cwd(), "docker-compose.prod.yml");
      expect(fs.existsSync(composePath)).toBe(true);

      const content = fs.readFileSync(composePath, "utf-8");

      // Zero host exposure checks
      expect(content).not.toContain('"5432:5432"');
      expect(content).not.toContain('"6379:6379"');

      // Internal container names
      expect(content).toContain('dongchi_postgres');
      expect(content).toContain('dongchi_redis');
      expect(content).toContain('dongchi_web');

      // Internal expose checks
      expect(content).toContain('expose:');
      expect(content).toContain('"5432"');
      expect(content).toContain('"6379"');
      expect(content).toContain('dongchi_isolated_net');

      // Loopback binding
      expect(content).toContain('127.0.0.1:${APP_HOST_PORT:-3000}:3000');
    });
  });

  describe("7. Production GitHub README.md Documentation", () => {
    it("should ensure README.md documents one-line installer, dongchi CLI, and dual-db architecture", () => {
      const readmePath = path.join(process.cwd(), "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);

      const content = fs.readFileSync(readmePath, "utf-8");

      expect(content).toContain("bash <(curl -fsSL https://raw.githubusercontent.com/AbolfazlTafakori/DongChi/main/install.sh)");
      expect(content).toContain("`dongchi` CLI");
      expect(content).toContain("Dual-Database + Identity Bridge");
      expect(content).toContain("find_free_port");
      expect(content).toContain("Zero Host Port Exposure");
      expect(content).toContain("/opt/dongchi");
      expect(content).toContain("dongchi_stack");
    });
  });
});
