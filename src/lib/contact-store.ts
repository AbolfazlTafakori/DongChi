import fs from 'fs';
import path from 'path';

export type ContactTopic = 'FEATURE' | 'BUG' | 'BILLING' | 'PARTNERSHIP';
export type ContactStatus = 'NEW' | 'RESOLVED';

export interface ContactMessageItem {
  id: string;
  trackingCode: string;
  topic: ContactTopic;
  name: string;
  contactInfo: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACT_FILE = path.join(DATA_DIR, 'contact-messages.json');

function ensureContactStore(): ContactMessageItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONTACT_FILE)) {
      fs.writeFileSync(CONTACT_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(CONTACT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveContactStore(items: ContactMessageItem[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACT_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save contact messages:', err);
  }
}

export function createContactMessage(input: {
  topic: ContactTopic;
  name: string;
  contactInfo: string;
  message: string;
}): ContactMessageItem {
  const items = ensureContactStore();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const newItem: ContactMessageItem = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    trackingCode: `DC-${randomDigits}`,
    topic: input.topic,
    name: input.name.trim(),
    contactInfo: input.contactInfo.trim(),
    message: input.message.trim(),
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  saveContactStore(items);
  return newItem;
}

export function getAllContactMessages(): ContactMessageItem[] {
  return ensureContactStore();
}

export function updateContactMessageStatus(
  id: string,
  status: ContactStatus
): ContactMessageItem | null {
  const items = ensureContactStore();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], status };
  saveContactStore(items);
  return items[idx];
}

export function deleteContactMessage(id: string): boolean {
  const items = ensureContactStore();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveContactStore(filtered);
  return true;
}
