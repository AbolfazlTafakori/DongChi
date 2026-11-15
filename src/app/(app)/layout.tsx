import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });
  } catch (err) {
    console.error("AppLayout user fetch error:", err);
  }

  const user = {
    id: session.userId,
    name: dbUser?.name || "کاربر دنگ‌چی",
    phone: dbUser?.phone || session.phone,
    role: dbUser?.role || session.role,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
