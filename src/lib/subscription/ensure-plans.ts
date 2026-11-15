import { prisma } from '@/lib/prisma';

export async function ensureStandardPlans() {
  const standardPlans = [
    {
      title: 'پرو طلایی (ماهانه)',
      slug: 'pro-monthly',
      price: 49000n,
      durationDays: 30,
      features: [
        'تا ۱۰ گروه همزمان',
        'تا ۵ کارت صندوق در هر گروه',
        'خروجی فایل اکسل فارسی (CSV)',
        'پوشش طلایی برای تمام هم‌خانه‌ها',
        'بودجه‌بندی و هشدار سرعت خرج',
        'پشتیبانی اولویت‌دار طلایی',
      ],
    },
    {
      title: 'پرو طلایی (سالانه)',
      slug: 'pro-yearly',
      price: 490000n,
      durationDays: 365,
      features: [
        'تمام امکانات پرو طلایی',
        '۲ ماه اشتراک کاملاً رایگان',
        'تا ۱۰ گروه همزمان',
        'خروجی اکسل کامل سالانه',
        'پوشش طلایی برای تمام هم‌خانه‌ها',
        'پشتیبانی اولویت‌دار طلایی',
      ],
    },
    {
      title: 'مکس VIP (ماهانه)',
      slug: 'max-monthly',
      price: 89000n,
      durationDays: 30,
      features: [
        'تعداد نامحدود گروه و ساختمان',
        'صندوق‌ها و کارت‌های نامحدود',
        'آرشیو دائمی و نامحدود',
        'خروجی اکسل پیشرفته',
        'پوشش فراگیر کل گروه‌ها',
        'پشتیبانی اختصاصی VIP',
      ],
    },
    {
      title: 'مکس VIP (سالانه)',
      slug: 'max-yearly',
      price: 890000n,
      durationDays: 365,
      features: [
        'تمامی امکانات مکس VIP',
        '۲ ماه رایگان با بیشترین تخفیف VIP',
        'گروه‌ها و ساختمان‌های نامحدود مطلق',
        'کارت‌ها و صندوق‌های نامحدود',
        'آرشیو دائمی دوره‌های مالی',
        'پشتیبانی اختصاصی VIP و اولویت امکانات',
      ],
    },
  ];

  for (const item of standardPlans) {
    await prisma.plan.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        price: item.price,
        durationDays: item.durationDays,
        features: item.features,
        isActive: true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        price: item.price,
        durationDays: item.durationDays,
        features: item.features,
        isActive: true,
      },
    });
  }

  return prisma.plan.findMany({
    where: { isActive: true, price: { gt: 0n } },
    orderBy: { price: 'asc' },
  });
}
