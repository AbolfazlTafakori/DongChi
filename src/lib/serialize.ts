/**
 * Recursively converts all BigInt values in an object or array to strings
 * for safe JSON serialization in Next.js API responses.
 */
export function serializeBigInt<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item));
  }

  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }

  return obj;
}

/**
 * Generates an 8-character uppercase alphanumeric invite code for groups.
 * Excludes easily confused characters like O, 0, I, 1.
 */
export function generateInviteCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates group invite code format (8 alphanumeric characters).
 */
export function isValidInviteCode(code: string): boolean {
  if (!code) return false;
  return /^[A-Za-z0-9]{8}$/.test(code.trim());
}
