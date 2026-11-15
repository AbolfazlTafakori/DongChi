import { prisma } from "@/lib/prisma";
import { Role, User } from "@prisma/client";
import { AdminAccount, findAdminById } from "./admin-db";
import { signSession } from "./session";

export interface BridgedAdminSession {
  user: User;
  token: string;
}

/**
 * Bridges an isolated AdminAccount to a corresponding User record in PostgreSQL
 * with Role.ADMIN, ensuring immediate access to both /admin and /app endpoints.
 */
export async function bridgeAdminToMainSiteUser(
  admin: AdminAccount
): Promise<BridgedAdminSession> {
  // Ensure that a User record exists for this admin's phone in PostgreSQL
  let user = await prisma.user.findFirst({
    where: { phone: admin.phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: admin.phone,
        name: admin.fullName || "مدیر ارشد",
        role: Role.ADMIN,
        isBanned: false,
      },
    });
  } else {
    // If the user already exists, guarantee role is ADMIN and not banned
    if (user.role !== Role.ADMIN || user.isBanned) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.ADMIN,
          isBanned: false,
          name: user.name || admin.fullName,
        },
      });
    }
  }

  // Sign standard JWT session with role: ADMIN
  const token = await signSession({
    userId: user.id,
    phone: user.phone,
    role: "ADMIN",
  });

  return { user, token };
}

/**
 * Synchronizes shadow user in PostgreSQL whenever an admin account is created or updated.
 */
export async function syncAdminShadowUser(adminId: string): Promise<User | null> {
  const admin = await findAdminById(adminId);
  if (!admin) return null;
  const { user } = await bridgeAdminToMainSiteUser(admin);
  return user;
}
