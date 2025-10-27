import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger/logger';

const TTL_MS = 10_000; // 60 seconds
const DEFAULT_STORE_PATH = path.resolve(
  process.cwd(),
  'data',
  'idempotency.json'
);
const HMAC_SECRET = process.env.IDEMPOTENCY_SECRET || 'default_hmac_secret';

export interface IdempotencyEntry {
  keySignature: string;
  createdAt: number;
}

class IdempotencyStore {
  private map = new Map<string, IdempotencyEntry>();
  private storeFile: string;

  constructor(storeFile?: string) {
    this.storeFile = storeFile || DEFAULT_STORE_PATH;
    this.loadFromFile();
  }

  // --- 🔐 Compute secure key signature ---
  private computeKeySignature(key: string): string {
    return crypto.createHmac('sha256', HMAC_SECRET).update(key).digest('hex');
  }

  private ensureDirExists(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // --- Load persisted store and purge expired entries ---
  private loadFromFile() {
    try {
      if (!fs.existsSync(this.storeFile)) return;
      const raw = fs.readFileSync(this.storeFile, 'utf8');
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, IdempotencyEntry>;
      const now = Date.now();
      for (const [k, v] of Object.entries(obj)) {
        if (now - v.createdAt <= TTL_MS) {
          this.map.set(k, v);
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to load idempotency store:', err);
    }
  }

  // --- Persist only valid entries to disk ---
  private persistToFile() {
    try {
      this.ensureDirExists(this.storeFile);
      const obj: Record<string, IdempotencyEntry> = {};
      const now = Date.now();
      for (const [k, v] of this.map.entries()) {
        if (now - v.createdAt <= TTL_MS) obj[k] = v;
      }
      fs.writeFileSync(this.storeFile, JSON.stringify(obj), {
        encoding: 'utf8',
      });
    } catch (err) {
      console.warn('⚠️ Failed to persist idempotency store:', err);
    }
  }

  // --- Retrieve and verify key integrity ---
  checkAndGet<T = any>(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.createdAt > TTL_MS) {
      this.map.delete(key);
      this.persistToFile();
      return undefined;
    }

    const currentSignature = this.computeKeySignature(key);
    if (entry.keySignature !== currentSignature) {
      throw new Error('Idempotency key integrity check failed');
    }

    return entry as T;
  }

  // --- Register a key as used ---
  set(key: string) {
    const keySignature = this.computeKeySignature(key);
    const entry: IdempotencyEntry = {
      keySignature,
      createdAt: Date.now(),
    };
    this.map.set(key, entry);
    this.persistToFile();
  }

  // --- Optional: explicit clear method for tests or manual reset ---
  //TODO: This should be automatically released by TTL in normal usage.
  clearExpired() {
    const now = Date.now();
    for (const [k, v] of this.map.entries()) {
      if (now - v.createdAt > TTL_MS) {
        logger.debug(`Clearing expired idempotency key: ${k}`);
        this.map.delete(k);
      }
    }
    this.persistToFile();
  }
}

export const idempotencyStore = new IdempotencyStore();
