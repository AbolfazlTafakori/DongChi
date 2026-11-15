import fs from 'fs';
import path from 'path';

export type FaqCategory = 'ACCOUNTING' | 'FUND' | 'SUBSCRIPTION' | 'SECURITY';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  badge?: string;
  order: number;
  isActive: boolean;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FAQ_FILE = path.join(DATA_DIR, 'faqs.json');

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'ACCOUNTING',
    question: 'الگوریتم ساده‌سازی بدهی‌ها (Simplify Debts) چگونه تعداد کارت‌به‌کارت‌ها را به حداقل می‌رساند؟',
    answer:
      'فرض کنید در طول ماه علی از سارا طلبکار شود، سارا از رضا و رضا از مریم. در روش سنتی باید ۶ تا ۸ کارت‌به‌کارت متقاطع انجام شود؛ اما موتور گراف مالی دنگ‌چی ابتدا تراز خالص (Net Balance) هر فرد را در کل گروه محاسبه کرده و بدهی‌های زنجیره‌ای را با هم ساده می‌کند تا هر عضو با کمترین تراکنش ممکن (معمولاً فقط ۱ انتقال) حساب خود را کاملاً صاف کند.',
    badge: 'پرتکرارترین سوال',
    order: 1,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-2',
    category: 'ACCOUNTING',
    question: 'در تقسیم مساوی مبالغی که رند نیستند (مثلاً ۱۰۰,۰۰۰ تومان بین ۳ نفر)، ۱ تومان باقیمانده چه می‌شود؟',
    answer:
      'برخلاف ماشین‌حساب‌های معمولی که اعداد اعشاری تولید می‌کنند و باعث اختلاف در جمع کل فاکتور می‌شوند، موتور دنگ‌چی بر پایه محاسبات دقیق BigInt کار می‌کند. در فاکتور ۱۰۰,۰۰۰ تومانی بین ۳ نفر، سهم‌ها به صورت ۳۳,۳۳۴ و ۳۳,۳۳۳ و ۳۳,۳۳۳ تومان ثبت می‌شود تا جمع سهم‌ها بدون حتی ۱ تومان خطا دقیقاً برابر با ۱۰۰,۰۰۰ تومان باقی بماند.',
    badge: 'دقت ۱۰۰٪ ریالی',
    order: 2,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-3',
    category: 'ACCOUNTING',
    question: '۴ روش دنگ‌بندی (مساوی، مبلغ دقیق، درصدی و سهمیه‌ای) هر کدام در چه مواقعی کاربرد دارند؟',
    answer:
      '۱) تقسیم مساوی: برای خریدهای مشترک روزمره مثل نان، لبنیات و اینترنت. ۲) مبلغ دقیق: وقتی هر نفر کالای مشخصی با قیمت متفاوت خریده است. ۳) درصدی: برای تقسیم اجاره‌بها یا قبوض بر اساس متراژ اتاق هر هم‌خانه (مثلاً ۴۰٪، ۳۰٪ و ۳۰٪). ۴) سهمیه‌ای (ضریب): زمانی که یکی از اعضا مهمان دارد و ۲ سهم و بقیه ۱ سهم مصرف کرده‌اند.',
    badge: '۴ حالت هوشمند',
    order: 3,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-4',
    category: 'FUND',
    question: 'تفاوت ثبت خرج از «جیب شخصی» با «صندوق مشترک خانه» در محاسبات چیست؟',
    answer:
      'وقتی خرجی از «جیب شخصی» ثبت می‌شود، فرد پرداخت‌کننده به اندازه کل فاکتور بستانکار (+) شده و سهم دنگ هر عضو از حسابش کسر (-) می‌گردد. اما وقتی گزینه «صندوق مشترک (کارت خانه)» انتخاب شود، مبلغ کل مستقیماً از موجودی کارت خانه کسر شده و هیچ فردی بستانکار نمی‌شود؛ بلکه فقط سهم مصرف هر عضو در تراز او منظور می‌گردد.',
    badge: 'مهم در حسابداری',
    order: 4,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-5',
    category: 'FUND',
    question: 'قابلیت «تطبیق موجودی کارت (Card Reconciliation)» چطور کسری یا کارمزدهای بانکی را صاف می‌کند؟',
    answer:
      'در دنیای واقعی گاهی کارمزد انتقال، پیامک بانکی یا خریدهای ریز فراموش‌شده باعث می‌شود موجودی واقعی کارت بانکی خانه کمتر از عدد داخل برنامه باشد. با زدن دکمه «تطبیق موجودی کارت» و وارد کردن موجودی واقعی بانک، دنگ‌چی به‌طور خودکار مابه‌التفاوت را به عنوان «هزینه مغایرت کارت» بین اعضا تقسیم می‌کند تا موجودی سیستم و بانک دقیقاً یکی شوند.',
    badge: 'ویژگی انحصاری',
    order: 5,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-6',
    category: 'SUBSCRIPTION',
    question: 'قانون طلایی خانه (Group Halo Effect) در اشتراک‌های دنگ‌چی چگونه کار می‌کند؟',
    answer:
      'در دنگ‌چی نیازی نیست تک‌تک هم‌خانه‌ها اشتراک بخرند! به محض اینکه تنها ۱ نفر از اعضای گروه اشتراک «پرو طلایی» یا «مکس VIP» تهیه کند، کل اعضای آن گروه به‌صورت خودکار به امکانات ویژه (مانند خروجی اکسل فارسی، صندوق‌های متعدد و بودجه‌بندی پیشرفته) دسترسی پیدا می‌کنند.',
    badge: 'قانون طلایی',
    order: 6,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-7',
    category: 'SUBSCRIPTION',
    question: 'تفاوت پلن «پرو طلایی (Pro)» با پلن «مکس (Max VIP)» چیست و اگر زودتر تمدید کنم روزهای قبلی می‌سوزد؟',
    answer:
      'پلن پرو طلایی برای خانه‌ها و جمع‌های دوستانه طراحی شده و امکان مدیریت تا ۱۰ گروه همزمان و ۵ صندوق مشترک در هر گروه را می‌دهد. پلن مکس VIP مخصوص مدیران ساختمان، خوابگاه‌ها و کاربران حرفه‌ای است و سقف گروه‌ها، صندوق‌ها و آرشیو را کاملاً نامحدود می‌کند. همچنین تمام تمدیدها در دنگ‌چی «تجمعی» هستند؛ یعنی روزهای جدید دقیقاً به انتهای اعتبار قبلی شما اضافه می‌شوند.',
    badge: 'مقایسه پلن‌ها',
    order: 7,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-8',
    category: 'SECURITY',
    question: 'آیا دنگ‌چی به رمز دوم، CVV2 یا حساب بانکی ما دسترسی دارد؟',
    answer:
      'خیر، به هیچ عنوان. دنگ‌چی یک سامانه حسابداری و مدیریت دنگ است و هرگز رمز کارت، رمز پویا یا CVV2 شما را دریافت نمی‌کند. ثبت شماره کارت ۱۶ رقمی در پروفایل صرفاً برای نمایش به هم‌خانه‌های خودتان است تا هنگام تسویه‌حساب بتوانند با ۱ کلیک شماره کارت شما را کپی و از طریق همراه بانک خودشان واریز کنند.',
    badge: 'امنیت بانکی',
    order: 8,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-9',
    category: 'SECURITY',
    question: 'اگر یکی از اعضای گروه فاکتوری را تغییر دهد یا پاک کند، بقیه متوجه می‌شوند؟',
    answer:
      'بله، ۱۰۰٪! در دنگ‌چی هیچ تغییری پنهان نمی‌ماند. سیستم «تاریخچه تغییرات ضدتقلب (Audit Log)» هرگونه ثبت، ویرایش مبلغ، تغییر نفرات یا حذف سند را با نام کاربر، ساعت دقیق و مقادیر «قبل و بعد از تغییر» ثبت می‌کند. علاوه بر این، مدیر گروه در پایان ماه می‌تواند دوره مالی را ببندد تا اسناد ماه قبل برای همیشه قفل شوند.',
    badge: 'ضدتقلب و شفاف',
    order: 9,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'faq-10',
    category: 'SECURITY',
    question: 'چطور می‌توانم دنگ‌چی را روی گوشی اندروید یا آیفون (iOS) نصب کنم؟',
    answer:
      'دنگ‌چی به فناوری وب‌اپلیکیشن پیشرونده (PWA) مجهز است. در گوشی‌های اندروید کافی است سایت را با مرورگر Chrome باز کرده و گزینه Install App (نصب برنامه) را بزنید. در آیفون (iOS) نیز سایت را در Safari باز کرده، دکمه Share را بزنید و گزینه Add to Home Screen را انتخاب کنید تا آیکون دنگ‌چی مثل یک اپلیکیشن بومی به صفحه اصلی گوشی شما اضافه شود.',
    badge: 'نصب موبایل PWA',
    order: 10,
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

function ensureStore(): FaqItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FAQ_FILE)) {
      fs.writeFileSync(FAQ_FILE, JSON.stringify(DEFAULT_FAQS, null, 2), 'utf-8');
      return [...DEFAULT_FAQS];
    }
    const raw = fs.readFileSync(FAQ_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(FAQ_FILE, JSON.stringify(DEFAULT_FAQS, null, 2), 'utf-8');
      return [...DEFAULT_FAQS];
    }
    return parsed;
  } catch {
    return [...DEFAULT_FAQS];
  }
}

function saveStore(items: FaqItem[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FAQ_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write FAQs store:', err);
  }
}

export function getPublicFaqs(): FaqItem[] {
  return ensureStore()
    .filter((item) => item.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getAllAdminFaqs(): FaqItem[] {
  return ensureStore().sort((a, b) => a.order - b.order);
}

export function createFaqItem(input: {
  category: FaqCategory;
  question: string;
  answer: string;
  badge?: string;
  order?: number;
  isActive?: boolean;
}): FaqItem {
  const items = ensureStore();
  const maxOrder = items.reduce((max, i) => Math.max(max, i.order), 0);
  const newItem: FaqItem = {
    id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category: input.category,
    question: input.question.trim(),
    answer: input.answer.trim(),
    badge: input.badge?.trim() || undefined,
    order: typeof input.order === 'number' ? input.order : maxOrder + 1,
    isActive: input.isActive ?? true,
    updatedAt: new Date().toISOString(),
  };
  items.push(newItem);
  saveStore(items);
  return newItem;
}

export function updateFaqItem(
  id: string,
  updates: Partial<Omit<FaqItem, 'id' | 'updatedAt'>>
): FaqItem | null {
  const items = ensureStore();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  const current = items[idx];
  const updated: FaqItem = {
    ...current,
    ...(updates.category !== undefined ? { category: updates.category } : {}),
    ...(updates.question !== undefined ? { question: updates.question.trim() } : {}),
    ...(updates.answer !== undefined ? { answer: updates.answer.trim() } : {}),
    ...(updates.badge !== undefined ? { badge: updates.badge.trim() || undefined } : {}),
    ...(updates.order !== undefined ? { order: Number(updates.order) } : {}),
    ...(updates.isActive !== undefined ? { isActive: Boolean(updates.isActive) } : {}),
    updatedAt: new Date().toISOString(),
  };
  items[idx] = updated;
  saveStore(items);
  return updated;
}

export function deleteFaqItem(id: string): boolean {
  const items = ensureStore();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveStore(filtered);
  return true;
}

export function resetDefaultFaqs(): FaqItem[] {
  saveStore(DEFAULT_FAQS);
  return [...DEFAULT_FAQS];
}
