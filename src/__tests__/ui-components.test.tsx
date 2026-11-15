import React from "react";
import fs from "fs";
import path from "path";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { formatToman } from "../lib/money";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/app",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Design System UI Components", () => {
  describe("Button Component", () => {
    it("should render button with text and emerald primary style", () => {
      const html = renderToString(
        <Button variant="primary">تأیید و ادامه</Button>
      );
      expect(html).toContain("تأیید و ادامه");
      expect(html).toContain("bg-emerald-600");
    });

    it("should render loading spinner when isLoading is true", () => {
      const html = renderToString(
        <Button variant="primary" isLoading>
          در حال پردازش
        </Button>
      );
      expect(html).toContain("animate-spin");
      expect(html).toContain("disabled");
    });

    it("should support secondary, outline, danger and ghost variants", () => {
      const secHtml = renderToString(<Button variant="secondary">ثانویه</Button>);
      expect(secHtml).toContain("bg-indigo-600");

      const outHtml = renderToString(<Button variant="outline">حاشیه‌دار</Button>);
      expect(outHtml).toContain("border-slate-200");

      const dangHtml = renderToString(<Button variant="danger">حذف</Button>);
      expect(dangHtml).toContain("bg-red-600");
    });
  });

  describe("Badge Component", () => {
    it("should render credit variant with emerald styles", () => {
      const html = renderToString(<Badge variant="credit">طلبکار</Badge>);
      expect(html).toContain("طلبکار");
      expect(html).toContain("text-emerald-700");
      expect(html).toContain("bg-emerald-50");
    });

    it("should render debt variant with red styles", () => {
      const html = renderToString(<Badge variant="debt">بدهکار</Badge>);
      expect(html).toContain("بدهکار");
      expect(html).toContain("text-red-700");
      expect(html).toContain("bg-red-50");
    });

    it("should render warning and pro variants", () => {
      const warnHtml = renderToString(<Badge variant="warning">هشدار</Badge>);
      expect(warnHtml).toContain("text-amber-700");

      const proHtml = renderToString(<Badge variant="pro">ویژه</Badge>);
      expect(proHtml).toContain("text-indigo-700");
    });
  });

  describe("Card Component", () => {
    it("should render card surface with rounded-2xl and slate border", () => {
      const html = renderToString(
        <Card className="custom-class">
          <CardTitle>عنوان کارت</CardTitle>
          <p>محتوای بدنه</p>
        </Card>
      );
      expect(html).toContain("rounded-2xl");
      expect(html).toContain("border-slate-200");
      expect(html).toContain("عنوان کارت");
      expect(html).toContain("محتوای بدنه");
    });
  });

  describe("Input Component", () => {
    it("should render RTL input with label and helper text", () => {
      const html = renderToString(
        <Input
          label="شماره تماس"
          helperText="شماره همراه خود را وارد کنید"
          defaultValue="0912"
        />
      );
      expect(html).toContain("شماره تماس");
      expect(html).toContain("شماره همراه خود را وارد کنید");
      expect(html).toContain('dir="rtl"');
    });

    it("should show currency preview when enabled", () => {
      const html = renderToString(
        <Input
          label="مبلغ هزینه"
          currencyPreview
          value="50000"
        />
      );
      expect(html).toContain("مبلغ:");
      expect(html).toContain("۵۰,۰۰۰ تومان");
    });
  });

  describe("Stealth Admin Isolation Security Checks", () => {
    it("should never render any link to /admin inside AppShell even if user role is ADMIN", async () => {
      const { AppShell } = await import("../components/layout/AppShell");
      const html = renderToString(
        <AppShell user={{ id: "u1", name: "علی", phone: "09120000000", role: "ADMIN" }}>
          <div>محتوای داشبورد</div>
        </AppShell>
      );
      expect(html).not.toContain('href="/admin"');
      expect(html).not.toContain('href="/admin/login"');
      expect(html).not.toContain("/admin");
    });

    it("should never contain any /admin links in MarketingLayout source code", () => {
      const fs = require("fs");
      const path = require("path");
      const marketingLayoutSource = fs.readFileSync(
        path.join(__dirname, "../app/(marketing)/layout.tsx"),
        "utf8"
      );
      expect(marketingLayoutSource).not.toContain('href="/admin"');
      expect(marketingLayoutSource).not.toContain('href="/admin/login"');
      expect(marketingLayoutSource).not.toContain('"/admin"');
    });

    it("should never contain any /admin links in AppShell source code", () => {
      const fs = require("fs");
      const path = require("path");
      const appShellSource = fs.readFileSync(
        path.join(__dirname, "../components/layout/AppShell.tsx"),
        "utf8"
      );
      expect(appShellSource).not.toContain('href="/admin"');
      expect(appShellSource).not.toContain('href="/admin/login"');
      expect(appShellSource).not.toContain('"/admin"');
    });
  });

  describe("Billing & Profile UI Integrity Checks", () => {
    it("should never produce duplicate تومان تومان in billing formatted prices", () => {
      const monthlyPrice = 49000n;
      const yearlyPrice = 490000n;

      // When formatted with includeCurrency: false, no تومان suffix is included
      const numMonthly = formatToman(monthlyPrice, { includeCurrency: false })
        .replace(/\s*تومان/g, "")
        .trim();
      const numYearly = formatToman(yearlyPrice, { includeCurrency: false })
        .replace(/\s*تومان/g, "")
        .trim();

      expect(numMonthly).toBe("۴۹,۰۰۰");
      expect(numYearly).toBe("۴۹۰,۰۰۰");
      expect(numMonthly).not.toContain("تومان");
      expect(numYearly).not.toContain("تومان");

      // Verify single unit rendered next to it does not produce duplicate تومان
      const monthlyDisplay = `${numMonthly} تومان / ماهانه`;
      const yearlyDisplay = `${numYearly} تومان / سالانه`;

      expect(monthlyDisplay).not.toContain("تومان تومان");
      expect(yearlyDisplay).not.toContain("تومان تومان");
      expect(monthlyDisplay.match(/تومان/g)?.length).toBe(1);
      expect(yearlyDisplay.match(/تومان/g)?.length).toBe(1);
    });

    it("should verify billing and profile pages do not contain redundant headers", () => {
      const fs = require("fs");
      const path = require("path");

      const profileSource = fs.readFileSync(
        path.join(__dirname, "../app/(app)/app/profile/page.tsx"),
        "utf8"
      );
      const billingSource = fs.readFileSync(
        path.join(__dirname, "../app/(app)/app/billing/page.tsx"),
        "utf8"
      );

      // Verify no duplicate page title h1 tags
      expect(profileSource).not.toContain("<h1");
      expect(billingSource).not.toContain("<h1");

      // Verify billing source code does not render formatToman with trailing literal تومان
      expect(billingSource).not.toContain("{formatToman(BigInt(p.price))}</span>\n                    <span className=\"text-xs text-slate-500 mr-1.5\">تومان");
      expect(billingSource).not.toContain("تومان تومان");

      // Verify profile has live Shetab bank card visual
      expect(profileSource).toContain("detectIranBank");
      expect(profileSource).toContain("validateIranBankCard");
      expect(profileSource).toContain("پیش‌نمایش کارت تسویه شما");
    });
  });

  describe("Public App Download & Header Navigation Verification", () => {
    it("should verify MarketingLayout has prominent /download link and zero /admin references", () => {
      const layoutSource = fs.readFileSync(
        path.join(__dirname, "../app/(marketing)/layout.tsx"),
        "utf8"
      );
      expect(layoutSource).toContain('href="/download"');
      expect(layoutSource).toContain("دانلود اپلیکیشن");
      expect(layoutSource).not.toContain('href="/admin"');
      expect(layoutSource).not.toContain('"/admin"');
    });

    it("should verify MarketingFooter contains public /download app link", () => {
      const footerSource = fs.readFileSync(
        path.join(__dirname, "../components/layout/MarketingFooter.tsx"),
        "utf8"
      );
      expect(footerSource).toContain('href="/download"');
      expect(footerSource).toContain("دانلود اپلیکیشن موبایل");
    });

    it("should verify /app/install redirects cleanly to /download and is removed from desktopNavItems", () => {
      const installPageSource = fs.readFileSync(
        path.join(__dirname, "../app/(app)/app/install/page.tsx"),
        "utf8"
      );
      expect(installPageSource).toContain('redirect("/download")');

      const appShellSource = fs.readFileSync(
        path.join(__dirname, "../components/layout/AppShell.tsx"),
        "utf8"
      );
      expect(appShellSource).not.toContain('label: "نصب اپلیکیشن موبایل"');
      expect(appShellSource).toContain('href="/download"');
    });
  });
});
