import "./globals.css";
import type { Metadata } from "next";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "دنگ‌چی | مدیریت هزینه‌ها و دنگ خانه",
  description:
    "سامانه هوشمند مدیریت هزینه‌های مشترک، بودجه‌بندی و تسویه دنگ خانه و خانواده",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <ToastProvider>
          <PwaRegistrar />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
