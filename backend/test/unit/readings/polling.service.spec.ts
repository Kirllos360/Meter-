import { Test, TestingModule } from '@nestjs/testing';
import { PollerService } from '../../../src/readings/polling/poller.service';
import { PollingScheduler } from '../../../src/readings/polling/polling.scheduler';

const mockFetchReading = jest.fn();

const mockAdapter: any = {
  meterType: 'test-electricity',
  fetchReading: mockFetchReading
};

describe('PollerService', () => {
  let service: PollerService;

  beforeEach(async () => {
    mockFetchReading.mockReset();
    mockFetchReading.mockResolvedValue({
      success: true,
      meterId: 'meter-1',
      reading: { meterId: 'meter-1', value: 150, timestamp: new Date() }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollerService]
    }).compile();
    service = module.get<PollerService>(PollerService);
    service.registerAdapter(mockAdapter);
  });

  it('should register an adapter', () => {
    expect(service.getRegisteredTypes()).toContain('test-electricity');
  });

  it('should poll successfully', async () => {
    const result = await service.pollMeter('meter-1', 'test-electricity');
    expect(result.success).toBe(true);
    expect(result.reading?.value).toBe(150);
  });

  it('should return error for unknown meter type', async () => {
    const result = await service.pollMeter('meter-x', 'unknown-type');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No adapter');
  });

  it('should retry on failure once then succeed', async () => {
    mockFetchReading.mockRejectedValueOnce(new Error('Timeout')).mockResolvedValueOnce({
      success: true,
      meterId: 'meter-1',
      reading: { meterId: 'meter-1', value: 200, timestamp: new Date() }
    });

    const result = await service.pollMeter('meter-1', 'test-electricity');
    expect(result.success).toBe(true);
    expect(mockFetchReading).toHaveBeenCalledTimes(2);
  });
});

describe('PollingScheduler', () => {
  let scheduler: PollingScheduler;

  beforeEach(async () => {
    process.env.POLLING_ENABLED = 'false';
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollerService, PollingScheduler]
    }).compile();
    scheduler = module.get<PollingScheduler>(PollingScheduler);
  });

  it('should be disabled by default', () => {
    expect(scheduler.isEnabled()).toBe(false);
  });

  it('should toggle on/off', () => {
    scheduler.toggle(true);
    expect(scheduler.isEnabled()).toBe(true);
    scheduler.toggle(false);
    expect(scheduler.isEnabled()).toBe(false);
  });

  it('should schedule and track tasks', () => {
    scheduler.toggle(true);
    scheduler.scheduleTask('task-1', 'meter-1', 'test', 60000);
    expect(scheduler.getActiveCount()).toBe(1);
    scheduler.unscheduleTask('task-1');
    expect(scheduler.getActiveCount()).toBe(0);
  });

  it('should stop all tasks on toggle off', () => {
    scheduler.toggle(true);
    scheduler.scheduleTask('task-1', 'meter-1', 'test', 60000);
    scheduler.scheduleTask('task-2', 'meter-2', 'test', 60000);
    expect(scheduler.getActiveCount()).toBe(2);
    scheduler.toggle(false);
    expect(scheduler.getActiveCount()).toBe(0);
  });
});
