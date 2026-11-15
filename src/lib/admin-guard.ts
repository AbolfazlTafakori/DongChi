import { getCurrentSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Role, User } from "@prisma/client";

export interface AdminAuthSuccess {
  admin: User;
  error?: undefined;
  status?: undefined;
}

export interface AdminAuthError {
  admin?: undefined;
  error: string;
  status: number;
}

export type AdminAuthResult = AdminAuthSuccess | AdminAuthError;

/**
 * Validates that the current request originates from an authenticated, unbanned ADMIN.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      error: "احراز هویت انجام نشده است. لطفاً ابتدا وارد شوید.",
      status: 401,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== Role.ADMIN || user.isBanned) {
    return {
      error: "شما دسترسی مدیریت سامانه دنگ‌چی را ندارید.",
      status: 403,
    };
  }

  return { admin: user };
}

/**
 * Pure validation helper ensuring an admin cannot accidentally lock themselves out
 * by banning or demoting their own admin account.
 */
export function validateAdminUserMutation(params: {
  actorId: string;
  targetUserId: string;
  nextRole?: Role;
  nextIsBanned?: boolean;
}): { valid: boolean; error?: string } {
  const { actorId, targetUserId, nextRole, nextIsBanned } = params;

  if (actorId === targetUserId) {
    if (nextIsBanned === true) {
      return {
        valid: false,
        error: "امکان مسدودسازی حساب مدیریت فعال شما توسط خودتان وجود ندارد.",
      };
    }
    if (nextRole && nextRole !== Role.ADMIN) {
      return {
        valid: false,
        error: "امکان تنزل رتبه حساب مدیریت خود به کاربر عادی وجود ندارد.",
      };
    }
  }

  return { valid: true };
}
