import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE_NAME, SessionPayload } from "./session";

/**
 * Retrieves and validates the current user session from HttpOnly cookies.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return await verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Asserts that a valid session exists. Throws an error if unauthenticated.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
