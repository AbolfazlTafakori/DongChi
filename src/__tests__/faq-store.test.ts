import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPublicFaqs,
  getAllAdminFaqs,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  resetDefaultFaqs,
} from '@/lib/faq-store';

describe('FAQ Persistent Store Tests', () => {
  beforeEach(() => {
    resetDefaultFaqs();
  });

  it('should seed and return 10 default public FAQs sorted by order', () => {
    const faqs = getPublicFaqs();
    expect(faqs.length).toBe(10);

    // Verify ordering
    for (let i = 0; i < faqs.length - 1; i++) {
      expect(faqs[i].order).toBeLessThanOrEqual(faqs[i + 1].order);
    }

    // Verify all returned are active
    faqs.forEach((item) => {
      expect(item.isActive).toBe(true);
      expect(item.question).toBeDefined();
      expect(item.answer).toBeDefined();
    });
  });

  it('should create a new FAQ item and persist it', () => {
    const newItem = createFaqItem({
      category: 'ACCOUNTING',
      question: 'آیا امکان ویرایش فاکتور ثبت شده وجود دارد؟',
      answer: 'بله، هر عضو می‌تواند فاکتور ثبت‌شده خود را ویرایش کند و تاریخچه تغییرات در لاگ ثبت می‌شود.',
      badge: 'جدید',
      order: 11,
      isActive: true,
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.question).toBe('آیا امکان ویرایش فاکتور ثبت شده وجود دارد؟');
    expect(newItem.order).toBe(11);

    const all = getAllAdminFaqs();
    expect(all.length).toBe(11);
    const found = all.find((f) => f.id === newItem.id);
    expect(found).toBeDefined();
  });

  it('should update an existing FAQ item', () => {
    const faqs = getAllAdminFaqs();
    const target = faqs[0];

    const updated = updateFaqItem(target.id, {
      question: 'سوال ویرایش‌شده تستی',
      badge: 'آپدیت',
      isActive: false,
    });

    expect(updated).not.toBeNull();
    expect(updated?.question).toBe('سوال ویرایش‌شده تستی');
    expect(updated?.badge).toBe('آپدیت');
    expect(updated?.isActive).toBe(false);

    // Inactive item should not appear in public FAQs
    const publicFaqs = getPublicFaqs();
    expect(publicFaqs.find((f) => f.id === target.id)).toBeUndefined();
  });

  it('should delete a FAQ item', () => {
    const faqs = getAllAdminFaqs();
    const countBefore = faqs.length;
    const targetId = faqs[0].id;

    const result = deleteFaqItem(targetId);
    expect(result).toBe(true);

    const allAfter = getAllAdminFaqs();
    expect(allAfter.length).toBe(countBefore - 1);
    expect(allAfter.find((f) => f.id === targetId)).toBeUndefined();
  });

  it('should reset default FAQs cleanly', () => {
    // Delete one
    const faqs = getAllAdminFaqs();
    deleteFaqItem(faqs[0].id);
    expect(getAllAdminFaqs().length).toBe(9);

    // Reset
    const restored = resetDefaultFaqs();
    expect(restored.length).toBe(10);
    expect(getAllAdminFaqs().length).toBe(10);
  });
});
