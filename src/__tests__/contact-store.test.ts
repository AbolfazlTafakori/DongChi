import { describe, it, expect } from 'vitest';
import {
  createContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from '@/lib/contact-store';

describe('Contact Messages Store Tests', () => {
  it('should create and persist a new contact message with tracking code', () => {
    const msg = createContactMessage({
      topic: 'FEATURE',
      name: 'مهدی کریمی',
      contactInfo: '09123334455',
      message: 'پیشنهاد می‌کنم قابلیت یادآور تسویه دنگ هفتگی اضافه شود.',
    });

    expect(msg.id).toBeDefined();
    expect(msg.trackingCode).toMatch(/^DC-\d{5}$/);
    expect(msg.topic).toBe('FEATURE');
    expect(msg.name).toBe('مهدی کریمی');
    expect(msg.status).toBe('NEW');

    const all = getAllContactMessages();
    const found = all.find((m) => m.id === msg.id);
    expect(found).toBeDefined();
  });

  it('should update contact message status to RESOLVED', () => {
    const msg = createContactMessage({
      topic: 'BUG',
      name: 'سارا احمدی',
      contactInfo: 'sara@example.com',
      message: 'در دانلود اکسل یک ستون خالی نمایش داده می‌شود.',
    });

    const updated = updateContactMessageStatus(msg.id, 'RESOLVED');
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('RESOLVED');

    const all = getAllContactMessages();
    const found = all.find((m) => m.id === msg.id);
    expect(found?.status).toBe('RESOLVED');
  });

  it('should delete a contact message cleanly', () => {
    const msg = createContactMessage({
      topic: 'BILLING',
      name: 'رضا کمالی',
      contactInfo: '09198887766',
      message: 'درخواست فاکتور رسمی برای اشتراک مکس.',
    });

    const deleted = deleteContactMessage(msg.id);
    expect(deleted).toBe(true);

    const all = getAllContactMessages();
    const found = all.find((m) => m.id === msg.id);
    expect(found).toBeUndefined();
  });
});
