type Release = () => void;

class LockManager {
  private queues: Map<string, Array<() => void>> = new Map();

  async acquire(key: string): Promise<Release> {
    return new Promise<Release>(resolve => {
      const queue = this.queues.get(key);

      const release = () => {
        const q = this.queues.get(key);
        if (q && q.length > 0) {
          // pop next and call it to resolve its acquire Promise
          const next = q.shift()!;
          next();
        } else {
          this.queues.delete(key);
        }
      };

      if (!queue) {
        // no queue, acquire immediately
        this.queues.set(key, []);
        resolve(release);
      } else {
        // queue up
        queue.push(() => resolve(release));
      }
    });
  }
}

// Export a singleton lock manager
export const lockManager = new LockManager();
