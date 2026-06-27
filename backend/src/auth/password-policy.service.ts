import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  validate(password: string): PasswordPolicyResult {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain a digit');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain a special character');
    return { valid: errors.length === 0, errors };
  }

  async isLockedOut(userId: string): Promise<boolean> {
    const since = new Date(Date.now() - this.LOCKOUT_WINDOW_MS);
    const recentFailures = await this.prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        attemptedAt: { gte: since }
      }
    });
    return recentFailures >= this.MAX_ATTEMPTS;
  }

  async recordAttempt(
    userId: string,
    ipAddress: string | undefined,
    success: boolean
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: { userId, ipAddress: ipAddress ?? null, success }
    });
  }

  getMaxAttempts(): number {
    return this.MAX_ATTEMPTS;
  }

  getLockoutDurationMs(): number {
    return this.LOCKOUT_WINDOW_MS;
  }
}
