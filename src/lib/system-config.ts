import fs from 'fs';
import path from 'path';
import {
  PlatformSystemConfig,
  DEFAULT_SYSTEM_CONFIG,
} from './system-config-types';

export * from './system-config-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'system-config.json');

export function getSystemConfig(): PlatformSystemConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_SYSTEM_CONFIG, null, 2), 'utf-8');
      return structuredClone(DEFAULT_SYSTEM_CONFIG);
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      payment: { ...DEFAULT_SYSTEM_CONFIG.payment, ...(parsed.payment || {}) },
      sms: { ...DEFAULT_SYSTEM_CONFIG.sms, ...(parsed.sms || {}) },
      cms: { ...DEFAULT_SYSTEM_CONFIG.cms, ...(parsed.cms || {}) },
      developer: { ...DEFAULT_SYSTEM_CONFIG.developer, ...(parsed.developer || {}) },
      mobileApp: { ...DEFAULT_SYSTEM_CONFIG.mobileApp, ...(parsed.mobileApp || {}) },
      updatedAt: parsed.updatedAt || DEFAULT_SYSTEM_CONFIG.updatedAt,
    };
  } catch {
    return structuredClone(DEFAULT_SYSTEM_CONFIG);
  }
}

export function updateSystemConfig(
  partial: Partial<Omit<PlatformSystemConfig, 'updatedAt'>>
): PlatformSystemConfig {
  const current = getSystemConfig();
  const next: PlatformSystemConfig = {
    payment: { ...current.payment, ...(partial.payment || {}) },
    sms: { ...current.sms, ...(partial.sms || {}) },
    cms: { ...current.cms, ...(partial.cms || {}) },
    developer: { ...current.developer, ...(partial.developer || {}) },
    mobileApp: { ...current.mobileApp, ...(partial.mobileApp || {}) },
    updatedAt: new Date().toISOString(),
  };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write system-config.json:', err);
  }
  return next;
}
