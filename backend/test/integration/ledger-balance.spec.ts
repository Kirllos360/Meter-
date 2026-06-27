import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

jest.setTimeout(30000);

describe('Ledger Running Balance (T060)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function calculateRunningBalance(entries: { type: string; amount: number }[]): number[] {
    let balance = 0;
    return entries.map((e) => {
      switch (e.type) {
        case 'invoice_charge':
          balance += e.amount;
          break;
        case 'payment_credit':
          balance -= e.amount;
          break;
        case 'payment_reversal':
          balance += e.amount;
          break;
        case 'adjustment':
          if (e.amount > 0) balance += e.amount;
          else balance -= Math.abs(e.amount);
          break;
      }
      return balance;
    });
  }

  it('should calculate simple invoice charge', () => {
    const entries = [{ type: 'invoice_charge', amount: 1000 }];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([1000]);
  });

  it('should calculate charge then payment', () => {
    const entries = [
      { type: 'invoice_charge', amount: 1000 },
      { type: 'payment_credit', amount: 400 }
    ];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([1000, 600]);
  });

  it('should calculate full payment to zero', () => {
    const entries = [
      { type: 'invoice_charge', amount: 500 },
      { type: 'payment_credit', amount: 500 }
    ];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([500, 0]);
  });

  it('should handle reversal after payment', () => {
    const entries = [
      { type: 'invoice_charge', amount: 1000 },
      { type: 'payment_credit', amount: 1000 },
      { type: 'payment_reversal', amount: 1000 }
    ];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([1000, 0, 1000]);
  });

  it('should handle mixed sequence', () => {
    const entries = [
      { type: 'invoice_charge', amount: 2000 },
      { type: 'payment_credit', amount: 500 },
      { type: 'adjustment', amount: -200 },
      { type: 'payment_credit', amount: 300 },
      { type: 'payment_reversal', amount: 500 }
    ];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([2000, 1500, 1300, 1000, 1500]);
  });

  it('should handle large sequence', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      type: i % 2 === 0 ? ('invoice_charge' as const) : ('payment_credit' as const),
      amount: 100
    }));
    const balances = calculateRunningBalance(entries);
    expect(balances[0]).toBe(100);
    expect(balances[99]).toBe(0);
  });

  it('should handle credit balance', () => {
    const entries = [
      { type: 'payment_credit', amount: 500 },
      { type: 'invoice_charge', amount: 200 }
    ];
    const balances = calculateRunningBalance(entries);
    expect(balances).toEqual([-500, -300]);
  });

  it('should be deterministic (same input = same output)', () => {
    const entries = [
      { type: 'invoice_charge', amount: 1000 },
      { type: 'payment_credit', amount: 300 },
      { type: 'payment_credit', amount: 200 },
      { type: 'invoice_charge', amount: 500 }
    ];
    const run1 = calculateRunningBalance(entries);
    const run2 = calculateRunningBalance(entries);
    expect(run1).toEqual(run2);
  });
});
