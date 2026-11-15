import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSession, SESSION_COOKIE_NAME } from "../lib/session";

describe("Route Protection Middleware", () => {
  const userPayload = {
    userId: "user_test_123",
    phone: "09121111111",
    role: "USER" as const,
  };

  const adminPayload = {
    userId: "admin_test_999",
    phone: "09120000000",
    role: "ADMIN" as const,
  };

  describe("Unauthenticated Access", () => {
    it("should redirect unauthenticated access from /app to /login", async () => {
      const request = new NextRequest("http://localhost:3000/app");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("from=%2Fapp");
    });

    it("should redirect unauthenticated access from /admin to /admin/login", async () => {
      const request = new NextRequest("http://localhost:3000/admin");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/admin/login");
      expect(location).toContain("from=%2Fadmin");
    });

    it("should allow unauthenticated access to /admin/login", async () => {
      const request = new NextRequest("http://localhost:3000/admin/login");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("should allow unauthenticated access to /login", async () => {
      const request = new NextRequest("http://localhost:3000/login");
      const response = await middleware(request);

      // Status 200 means NextResponse.next()
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("Authenticated USER Role Access", () => {
    it("should allow USER role access to /app", async () => {
      const token = await signSession(userPayload);
      const request = new NextRequest("http://localhost:3000/app", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("should redirect USER role access from /admin to /admin/login?error=forbidden", async () => {
      const token = await signSession(userPayload);
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/admin/login");
      expect(location).toContain("error=forbidden");
    });

    it("should redirect authenticated USER from /login to /app", async () => {
      const token = await signSession(userPayload);
      const request = new NextRequest("http://localhost:3000/login", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/app");
    });
  });

  describe("Authenticated ADMIN Role Access", () => {
    it("should allow ADMIN role access to /admin", async () => {
      const token = await signSession(adminPayload);
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("should redirect authenticated user from /login to /app (never /admin)", async () => {
      const token = await signSession(adminPayload);
      const request = new NextRequest("http://localhost:3000/login", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/app");
    });

    it("should redirect authenticated ADMIN from /admin/login to /admin", async () => {
      const token = await signSession(adminPayload);
      const request = new NextRequest("http://localhost:3000/admin/login", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);
      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/admin");
    });
  });
});
