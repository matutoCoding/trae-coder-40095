interface LockItem {
  key: string;
  version: number;
  timestamp: number;
}

class OptimisticLockManager {
  private locks: Map<string, LockItem> = new Map();
  private lockTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly LOCK_TIMEOUT = 30000;

  acquire(key: string, currentVersion: number): boolean {
    const existing = this.locks.get(key);
    
    if (existing && existing.timestamp + this.LOCK_TIMEOUT > Date.now()) {
      return false;
    }
    
    this.locks.set(key, {
      key,
      version: currentVersion,
      timestamp: Date.now()
    });
    
    this.clearLockTimer(key);
    this.setLockTimer(key);
    
    console.log(`[Lock] Acquired lock for ${key}, version: ${currentVersion}`);
    return true;
  }

  release(key: string): void {
    this.locks.delete(key);
    this.clearLockTimer(key);
    console.log(`[Lock] Released lock for ${key}`);
  }

  checkVersion(key: string, expectedVersion: number): boolean {
    const lock = this.locks.get(key);
    if (!lock) return true;
    return lock.version === expectedVersion;
  }

  incrementVersion(key: string): number {
    const lock = this.locks.get(key);
    if (lock) {
      lock.version += 1;
      lock.timestamp = Date.now();
      return lock.version;
    }
    return 0;
  }

  private setLockTimer(key: string): void {
    const timer = setTimeout(() => {
      this.release(key);
      console.log(`[Lock] Auto-released lock for ${key} due to timeout`);
    }, this.LOCK_TIMEOUT);
    this.lockTimers.set(key, timer);
  }

  private clearLockTimer(key: string): void {
    const timer = this.lockTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.lockTimers.delete(key);
    }
  }

  isLocked(key: string): boolean {
    const lock = this.locks.get(key);
    if (!lock) return false;
    return lock.timestamp + this.LOCK_TIMEOUT > Date.now();
  }
}

export const lockManager = new OptimisticLockManager();

export async function withLock<T>(
  key: string,
  currentVersion: number,
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!lockManager.acquire(key, currentVersion)) {
    return { success: false, error: '操作频繁，请稍后重试' };
  }

  try {
    const result = await operation();
    lockManager.incrementVersion(key);
    return { success: true, data: result };
  } catch (error) {
    console.error(`[Lock] Operation failed for ${key}:`, error);
    return { success: false, error: error instanceof Error ? error.message : '操作失败' };
  } finally {
    lockManager.release(key);
  }
}

export class QuotaVersionManager {
  private versions: Map<string, number> = new Map();

  getVersion(key: string): number {
    return this.versions.get(key) || 0;
  }

  increment(key: string): number {
    const current = this.getVersion(key);
    const next = current + 1;
    this.versions.set(key, next);
    console.log(`[QuotaVersion] ${key}: ${current} -> ${next}`);
    return next;
  }

  checkAndIncrement(key: string, expectedVersion: number): boolean {
    const current = this.getVersion(key);
    if (current !== expectedVersion) {
      console.log(`[QuotaVersion] Version mismatch for ${key}: expected ${expectedVersion}, actual ${current}`);
      return false;
    }
    this.increment(key);
    return true;
  }

  reset(key: string): void {
    this.versions.set(key, 0);
  }
}

export const quotaVersionManager = new QuotaVersionManager();
