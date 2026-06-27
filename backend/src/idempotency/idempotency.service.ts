import { Injectable, Optional, OnModuleDestroy } from '@nestjs/common';

export interface IdempotencyRecord {
  id: string;
  scopedKey: string;
  method: string;
  route: string;
  actor: string;
  requestHash?: string;
  responseBody?: unknown;
  responseStatus: number;
  createdAt: Date;
  expiredAt?: Date;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly ttl: number;
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(@Optional() ttlMs?: number) {
    this.ttl = ttlMs ?? ONE_HOUR_MS;
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  async createRecord(
    scopedKey: string,
    method: string,
    route: string,
    actor: string,
    requestHash?: string
  ): Promise<IdempotencyRecord> {
    const rec: IdempotencyRecord = {
      id: crypto.randomUUID(),
      scopedKey,
      method,
      route,
      actor,
      requestHash,
      responseStatus: 0,
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + this.ttl)
    };
    this.store.set(scopedKey, rec);
    return rec;
  }

  async findByKey(scopedKey: string): Promise<IdempotencyRecord | null> {
    const rec = this.store.get(scopedKey);
    if (!rec) return null;
    if (rec.expiredAt && rec.expiredAt < new Date()) {
      this.store.delete(scopedKey);
      return null;
    }
    return rec;
  }

  async setResponse(
    scopedKey: string,
    responseBody: unknown,
    responseStatus: number
  ): Promise<void> {
    const rec = this.store.get(scopedKey);
    if (rec) {
      rec.responseBody = responseBody;
      rec.responseStatus = responseStatus;
    }
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, rec] of this.store.entries()) {
      if (rec.expiredAt && rec.expiredAt < now) {
        this.store.delete(key);
      }
    }
  }
}
