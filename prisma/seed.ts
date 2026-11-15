import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting idempotent seed...");

  // 1. Seed System Categories
  const systemCategories = [
    {
      name: "خوراک و سوپرمارکت",
      icon: "ShoppingCart",
      color: "#10B981",
      isSystem: true,
    },
    {
      name: "اجاره و شارژ ساختمان",
      icon: "Home",
      color: "#3B82F6",
      isSystem: true,
    },
    {
      name: "قبوض و اینترنت",
      icon: "Zap",
      color: "#F59E0B",
      isSystem: true,
    },
    {
      name: "رفت‌وآمد",
      icon: "Car",
      color: "#8B5CF6",
      isSystem: true,
    },
    {
      name: "لوازم و تعمیرات خانه",
      icon: "Wrench",
      color: "#EC4899",
      isSystem: true,
    },
    {
      name: "سایر هزینه‌ها",
      icon: "MoreHorizontal",
      color: "#64748B",
      isSystem: true,
    },
  ];

  for (const cat of systemCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isSystem: true },
    });
    if (!existing) {
      await prisma.category.create({
        data: cat,
      });
      console.log(`Created category: ${cat.name}`);
    } else {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, color: cat.color },
      });
      console.log(`Updated category: ${cat.name}`);
    }
  }

  // 2. Seed Subscription Plans
  const plans = [
    {
      title: "پایه رایگان",
      slug: "free",
      price: BigInt(0),
      durationDays: 365,
      features: [
        "۱ گروه خانوادگی",
        "تا ۵ عضو",
        "ثبت نامحدود هزینه",
        "گزارش‌های پایه",
      ],
      isActive: true,
    },
    {
      title: "حرفه‌ای ماهانه",
      slug: "pro-monthly",
      price: BigInt(49000), // 49,000 Tomans
      durationDays: 30,
      features: [
        "گروه‌های نامحدود",
        "اعضای نامحدود",
        "گزارش‌گیری اکسل و PDF",
        "صندوق مشترک خانه (کارت بانکی)",
        "بودجه‌بندی هوشمند",
      ],
      isActive: true,
    },
    {
      title: "حرفه‌ای سالانه",
      slug: "pro-yearly",
      price: BigInt(490000), // 490,000 Tomans (2 months discount)
      durationDays: 365,
      features: [
        "تمامی امکانات پلن حرفه‌ای",
        "۲ ماه تخفیف رایگان",
        "پشتیبانی اختصاصی و اولویت‌دار",
        "دسترسی زودهنگام به قابلیت‌های جدید",
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        title: plan.title,
        price: plan.price,
        durationDays: plan.durationDays,
        features: plan.features,
        isActive: plan.isActive,
      },
      create: plan,
    });
    console.log(`Upserted plan: ${plan.title}`);
  }

  // 3. Seed Users
  // Admin User
  await prisma.user.upsert({
    where: { phone: "09120000000" },
    update: {
      name: "مدیر سیستم",
      role: Role.ADMIN,
      isBanned: false,
    },
    create: {
      name: "مدیر سیستم",
      phone: "09120000000",
      role: Role.ADMIN,
      isBanned: false,
    },
  });
  console.log("Upserted Admin User: 09120000000");

  // Regular Test User
  await prisma.user.upsert({
    where: { phone: "09121111111" },
    update: {
      name: "کاربر تست",
      role: Role.USER,
      isBanned: false,
    },
    create: {
      name: "کاربر تست",
      phone: "09121111111",
      role: Role.USER,
      isBanned: false,
    },
  });
  console.log("Upserted Regular Test User: 09121111111");

  console.log("Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
