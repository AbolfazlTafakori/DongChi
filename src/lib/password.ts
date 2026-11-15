import crypto from "crypto";

/**
 * Standard scrypt configuration for cryptographic password hashing.
 * Output format: scrypt:<saltHex>:<keyHex>
 */
const KEY_LENGTH = 64;
const PREFIX = "scrypt";

/**
 * Hashes a plaintext password using Node's native scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored scrypt password hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    return false;
  }

  const [, salt, originalKeyHex] = parts;
  if (!salt || !originalKeyHex) {
    return false;
  }

  try {
    const originalKeyBuffer = Buffer.from(originalKeyHex, "hex");
    const derivedKeyBuffer = crypto.scryptSync(password, salt, originalKeyBuffer.length);
    return crypto.timingSafeEqual(originalKeyBuffer, derivedKeyBuffer);
  } catch {
    return false;
  }
}
