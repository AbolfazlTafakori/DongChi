import fs from 'fs';
import path from 'path';

export interface P2pPaymentIntent {
  authority: string;
  idempotencyKey: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  creditorName: string;
  creditorCard?: string;
  creditorSheba?: string;
  amount: string; // Toman BigInt string
  commissionAmount: string;
  totalPayable: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  refId?: string;
  createdAt: string;
  completedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const P2P_FILE = path.join(DATA_DIR, 'p2p-settlements.json');

function readIntents(): P2pPaymentIntent[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(P2P_FILE)) {
      fs.writeFileSync(P2P_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(P2P_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeIntents(intents: P2pPaymentIntent[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(P2P_FILE, JSON.stringify(intents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write p2p-settlements.json:', err);
  }
}

/**
 * Creates or retrieves an existing P2P payment intent with Idempotency Guard.
 * If the exact same idempotencyKey or same (fromUser + toUser + amount) was submitted within 30s,
 * returns the existing pending intent to prevent duplicate charges.
 */
export function createP2pPaymentIntent(input: {
  idempotencyKey?: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  creditorName: string;
  creditorCard?: string;
  creditorSheba?: string;
  amount: string;
  commissionAmount?: string;
  totalPayable?: string;
}): P2pPaymentIntent {
  const intents = readIntents();
  const now = new Date();

  const key =
    input.idempotencyKey ||
    `idem_${input.fromUserId}_${input.toUserId}_${input.amount}_${Math.floor(now.getTime() / 30000)}`;

  // Idempotency check: matching idempotency key or recent pending intent within 30s
  const existing = intents.find((it) => {
    if (it.idempotencyKey === key) return true;
    if (
      it.fromUserId === input.fromUserId &&
      it.toUserId === input.toUserId &&
      it.amount === input.amount &&
      it.groupId === input.groupId &&
      it.status === 'PENDING'
    ) {
      const intentAgeMs = now.getTime() - new Date(it.createdAt).getTime();
      return intentAgeMs < 30000;
    }
    return false;
  });

  if (existing) {
    return existing;
  }

  const commission = input.commissionAmount || '0';
  const total =
    input.totalPayable ||
    (BigInt(input.amount) + BigInt(commission)).toString();

  const authority = `p2p_shp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const newIntent: P2pPaymentIntent = {
    authority,
    idempotencyKey: key,
    groupId: input.groupId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    creditorName: input.creditorName,
    creditorCard: input.creditorCard,
    creditorSheba: input.creditorSheba,
    amount: input.amount,
    commissionAmount: commission,
    totalPayable: total,
    status: 'PENDING',
    createdAt: now.toISOString(),
  };

  intents.push(newIntent);
  writeIntents(intents);

  return newIntent;
}

export function getP2pPaymentIntent(authority: string): P2pPaymentIntent | null {
  const intents = readIntents();
  return intents.find((it) => it.authority === authority) || null;
}

export function completeP2pPaymentIntent(
  authority: string,
  refId: string
): P2pPaymentIntent | null {
  const intents = readIntents();
  const intent = intents.find((it) => it.authority === authority);
  if (!intent) return null;

  intent.status = 'COMPLETED';
  intent.refId = refId;
  intent.completedAt = new Date().toISOString();

  writeIntents(intents);
  return intent;
}

export function failP2pPaymentIntent(authority: string): P2pPaymentIntent | null {
  const intents = readIntents();
  const intent = intents.find((it) => it.authority === authority);
  if (!intent) return null;

  intent.status = 'FAILED';
  writeIntents(intents);
  return intent;
}

export function listP2pPaymentIntents(groupId: string): P2pPaymentIntent[] {
  const intents = readIntents();
  return intents.filter((it) => it.groupId === groupId);
}
