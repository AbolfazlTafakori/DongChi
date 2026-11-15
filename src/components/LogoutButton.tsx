"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "ghost" | "outline" | "danger" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export function LogoutButton({
  className,
  variant = "ghost",
  size = "sm",
  children,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      isLoading={loading}
      onClick={handleLogout}
      className={cn(
        variant === "ghost"
          ? "text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5"
          : "gap-2 text-xs font-bold",
        className
      )}
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{children || "خروج"}</span>
    </Button>
  );
}
