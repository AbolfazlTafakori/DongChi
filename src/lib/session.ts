import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  phone: string;
  role: "USER" | "ADMIN";
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "dongchi_super_secret_jwt_encryption_key_2026_production";

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export const SESSION_COOKIE_NAME = "session_token";

/**
 * Returns standardized, hardened session cookie options.
 * In local development with DEV_STATIC_OTP, secure is false so HTTP localhost works seamlessly.
 * In strict production without DEV_STATIC_OTP, secure is enforced for HTTPS.
 */
export function getSessionCookieOptions() {
  const isDevStatic = Boolean(process.env.DEV_STATIC_OTP?.trim());
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProduction && !isDevStatic,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}

/**
 * Signs a session JWT for Edge and Node runtime compatibility using jose.
 */
export async function signSession(
  payload: SessionPayload,
  expiresIn = "30d"
): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verifies a session JWT. Returns the payload or null if invalid/expired.
 */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId === "string" &&
      typeof payload.phone === "string" &&
      (payload.role === "USER" || payload.role === "ADMIN")
    ) {
      return {
        userId: payload.userId,
        phone: payload.phone,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convenience helper to get the verified session for Server Components and Route Handlers.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const { cookies } = await import("next/headers");
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    return verifySession(token);
  } catch {
    return null;
  }
}

