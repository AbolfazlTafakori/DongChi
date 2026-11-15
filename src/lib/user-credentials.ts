import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "./password";
import { normalizePhone } from "./validation";

export interface UserCredential {
  userId: string;
  phone: string;
  passwordHash: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_FILE = path.join(DATA_DIR, "user-credentials.json");

// In-Memory RAM Cache for ultra-fast zero-disk credential lookups
let cachedCredentials: Record<string, UserCredential> | null = null;

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCredentials(): Record<string, UserCredential> {
  if (cachedCredentials !== null) {
    return cachedCredentials;
  }
  ensureDirectoryExists();
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    cachedCredentials = {};
    return {};
  }
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const data = typeof parsed === "object" && parsed !== null ? parsed : {};
    cachedCredentials = data;
    return data;
  } catch (error) {
    console.error("Error reading user-credentials.json:", error);
    cachedCredentials = {};
    return {};
  }
}

function writeCredentials(data: Record<string, UserCredential>): void {
  cachedCredentials = data;
  ensureDirectoryExists();
  fs.promises.writeFile(CREDENTIALS_FILE, JSON.stringify(data, null, 2), "utf-8").catch((err) => {
    console.error("Error writing user-credentials.json asynchronously:", err);
  });
}

export async function getUserCredential(phone: string): Promise<UserCredential | null> {
  const cleanPhone = normalizePhone(phone);
  const data = readCredentials();
  return data[cleanPhone] || null;
}

export async function hasUserPassword(phone: string): Promise<boolean> {
  const cred = await getUserCredential(phone);
  return Boolean(cred && cred.passwordHash);
}

export async function setUserPassword(
  userId: string,
  phone: string,
  password: string
): Promise<UserCredential> {
  if (!password || password.length < 6) {
    throw new Error("رمز عبور باید حداقل ۶ نویسه باشد.");
  }

  const cleanPhone = normalizePhone(phone);
  const data = readCredentials();

  const credential: UserCredential = {
    userId,
    phone: cleanPhone,
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
  };

  data[cleanPhone] = credential;
  writeCredentials(data);

  return credential;
}

export async function verifyUserPassword(phone: string, password: string): Promise<boolean> {
  const cred = await getUserCredential(phone);
  if (!cred || !cred.passwordHash) {
    return false;
  }
  return verifyPassword(password, cred.passwordHash);
}
