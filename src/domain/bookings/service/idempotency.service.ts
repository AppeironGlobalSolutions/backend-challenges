import { idempotencyStore } from '../../../store/idempotency.store';

export class IdempotencyService {
  /**
   * Verifies if a request with this key has already been processed.
   * Throws an error if the key integrity check fails.
   */
  async checkExisting(key: string): Promise<boolean> {
    const entry = idempotencyStore.checkAndGet(key);
    return entry !== undefined;
  }

  /**
   * Registers a new idempotency key.
   * If the key already exists, throws an error.
   */
  async registerKey(key: string): Promise<void> {
    const existing = idempotencyStore.checkAndGet(key);
    if (existing) {
      throw new Error(`Idempotency key '${key}' already used`);
    }
    idempotencyStore.set(key);
  }

  /**
   * Safe check-and-register helper (atomic intent).
   * Returns `true` if registered successfully, `false` if already exists.
   */
  async tryRegister(key: string): Promise<boolean> {
    const exists = idempotencyStore.checkAndGet(key);
    if (exists) return false;
    idempotencyStore.set(key);
    return true;
  }

  /**
   * Clear expired keys (maintenance task).
   */
  async cleanupExpired(): Promise<void> {
    idempotencyStore.clearExpired();
  }
}

// export a singleton instance
export const idempotencyService = new IdempotencyService();
