import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword } from "./password";
import { normalizePhone, isValidIranianPhone } from "./validation";

export type AdminRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN";

export interface AdminAccount {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type PublicAdminAccount = Omit<AdminAccount, "passwordHash">;

const DATA_DIR = path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admins-db.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAdminsFromFile(): AdminAccount[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ADMINS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(ADMINS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading admins-db.json:", error);
    return [];
  }
}

function writeAdminsToFile(admins: AdminAccount[]): void {
  ensureDirectoryExists();
  const tmpFile = `${ADMINS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(admins, null, 2), "utf-8");
  fs.renameSync(tmpFile, ADMINS_FILE);
}

/**
 * Initializes and seeds the admin database if empty using environment variables.
 */
export async function ensureAdminDatabaseSeeded(): Promise<AdminAccount[]> {
  let admins = readAdminsFromFile();
  if (admins.length > 0) {
    return admins;
  }

  const initialUser = (process.env.INITIAL_ADMIN_USER || "admin").trim().toLowerCase();
  const initialPass = process.env.INITIAL_ADMIN_PASS || "admin123456";
  const initialPhone = normalizePhone(process.env.INITIAL_ADMIN_PHONE || "09120000000");

  const seedAdmin: AdminAccount = {
    id: `admin_seed_${crypto.randomBytes(4).toString("hex")}`,
    username: initialUser,
    passwordHash: hashPassword(initialPass),
    fullName: "مدیر ارشد سامانه",
    phone: initialPhone,
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  admins = [seedAdmin];
  writeAdminsToFile(admins);
  return admins;
}

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const admins = await ensureAdminDatabaseSeeded();
  return admins;
}

export function sanitizeAdmin(admin: AdminAccount): PublicAdminAccount {
  const { passwordHash: _, ...publicData } = admin;
  return publicData;
}

export async function getPublicAdminAccounts(): Promise<PublicAdminAccount[]> {
  const accounts = await getAdminAccounts();
  return accounts.map(sanitizeAdmin);
}

export async function findAdminById(id: string): Promise<AdminAccount | null> {
  const accounts = await getAdminAccounts();
  return accounts.find((a) => a.id === id) || null;
}

export async function findAdminByUsername(username: string): Promise<AdminAccount | null> {
  const clean = username.trim().toLowerCase();
  const accounts = await getAdminAccounts();
  return accounts.find((a) => a.username.toLowerCase() === clean) || null;
}

export async function findAdminByPhone(phone: string): Promise<AdminAccount | null> {
  const clean = normalizePhone(phone);
  const accounts = await getAdminAccounts();
  return accounts.find((a) => a.phone === clean) || null;
}

export async function createAdminAccount(data: {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  role: AdminRole;
}): Promise<AdminAccount> {
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanPhone = normalizePhone(data.phone);

  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error("نام کاربری مدیر باید حداقل ۳ نویسه باشد.");
  }

  if (!isValidIranianPhone(cleanPhone)) {
    throw new Error("شماره موبایل مدیر نامعتبر است (فرمت صحیح: ۰۹۱۲۰۰۰۰۰۰۰).");
  }

  if (!data.password || data.password.length < 6) {
    throw new Error("رمز عبور مدیر باید حداقل ۶ نویسه باشد.");
  }

  const existingByUsername = await findAdminByUsername(cleanUsername);
  if (existingByUsername) {
    throw new Error(`نام کاربری «${cleanUsername}» قبلاً برای مدیر دیگری ثبت شده است.`);
  }

  const existingByPhone = await findAdminByPhone(cleanPhone);
  if (existingByPhone) {
    throw new Error(`شماره موبایل «${cleanPhone}» قبلاً برای مدیر دیگری ثبت شده است.`);
  }

  const newAdmin: AdminAccount = {
    id: `admin_${crypto.randomBytes(6).toString("hex")}`,
    username: cleanUsername,
    passwordHash: hashPassword(data.password),
    fullName: data.fullName.trim() || "مدیر سیستم",
    phone: cleanPhone,
    role: data.role || "SUPPORT_ADMIN",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const accounts = await getAdminAccounts();
  accounts.push(newAdmin);
  writeAdminsToFile(accounts);

  return newAdmin;
}

export async function updateAdminAccount(
  id: string,
  updates: {
    fullName?: string;
    phone?: string;
    role?: AdminRole;
    isActive?: boolean;
    password?: string;
    lastLoginAt?: string;
  }
): Promise<AdminAccount> {
  const accounts = await getAdminAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error("حساب مدیریت مورد نظر یافت نشد.");
  }

  const target = accounts[index];

  if (updates.phone) {
    const cleanPhone = normalizePhone(updates.phone);
    if (!isValidIranianPhone(cleanPhone)) {
      throw new Error("فرمت شماره موبایل نامعتبر است.");
    }
    const duplicate = accounts.find((a) => a.phone === cleanPhone && a.id !== id);
    if (duplicate) {
      throw new Error("این شماره موبایل توسط مدیر دیگری استفاده شده است.");
    }
    target.phone = cleanPhone;
  }

  if (updates.fullName !== undefined) {
    target.fullName = updates.fullName.trim();
  }

  if (updates.role !== undefined) {
    target.role = updates.role;
  }

  if (updates.isActive !== undefined) {
    target.isActive = updates.isActive;
  }

  if (updates.password) {
    if (updates.password.length < 6) {
      throw new Error("رمز عبور جدید باید حداقل ۶ نویسه باشد.");
    }
    target.passwordHash = hashPassword(updates.password);
  }

  if (updates.lastLoginAt !== undefined) {
    target.lastLoginAt = updates.lastLoginAt;
  }

  target.updatedAt = new Date().toISOString();
  accounts[index] = target;
  writeAdminsToFile(accounts);

  return target;
}

export async function deleteAdminAccount(
  id: string,
  actorId?: string
): Promise<{ success: boolean; error?: string }> {
  const accounts = await getAdminAccounts();
  const target = accounts.find((a) => a.id === id);

  if (!target) {
    return { success: false, error: "حساب مدیریت یافت نشد." };
  }

  if (actorId && target.id === actorId) {
    return { success: false, error: "امکان حذف حساب کاربری خودتان وجود ندارد." };
  }

  const superAdmins = accounts.filter((a) => a.role === "SUPER_ADMIN" && a.isActive);
  if (target.role === "SUPER_ADMIN" && superAdmins.length <= 1) {
    return {
      success: false,
      error: "امکان حذف تنها مدیر ارشد فعال سامانه وجود ندارد.",
    };
  }

  const filtered = accounts.filter((a) => a.id !== id);
  writeAdminsToFile(filtered);

  return { success: true };
}
