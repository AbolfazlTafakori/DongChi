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

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCredentials(): Record<string, UserCredential> {
  ensureDirectoryExists();
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    console.error("Error reading user-credentials.json:", error);
    return {};
  }
}

function writeCredentials(data: Record<string, UserCredential>): void {
  ensureDirectoryExists();
  const tmpFile = `${CREDENTIALS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, CREDENTIALS_FILE);
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
