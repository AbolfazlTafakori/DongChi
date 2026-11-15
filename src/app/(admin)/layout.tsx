import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (!session) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== Role.ADMIN || user.isBanned) {
    redirect("/admin/login?error=forbidden");
  }

  return (
    <AdminShell
      user={{
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
