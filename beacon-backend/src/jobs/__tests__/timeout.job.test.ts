import { processTimeoutJob } from '../timeout.job';
import prisma from '../../db/prisma';
import { emitToOrg } from '../../services/websocket.service';
import { notificationQueue } from '../../services/queue.service';

// Mock dependencies
jest.mock('../../db/prisma', () => ({
  signal: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  resolution: {
    create: jest.fn()
  },
  $transaction: jest.fn((callback) => callback(prisma))
}));

jest.mock('../../services/websocket.service', () => ({
  emitToOrg: jest.fn()
}));

jest.mock('../../services/queue.service', () => ({
  notificationQueue: {
    add: jest.fn()
  }
}));

describe('processTimeoutJob SLA Failsafe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should force a fail-closed TIMED_OUT resolution if human does not respond in time', async () => {
    const mockJob = { data: { signalId: 'sig-123' } } as any;

    const mockSignal = {
      id: 'sig-123',
      orgId: 'org-456',
      status: 'PENDING',
      decisionNeeded: { default_if_timeout: 'ABORT_ACTION' },
      receivedAt: new Date(Date.now() - 300000) // 5 mins ago
    };

    (prisma.signal.findUnique as jest.Mock).mockResolvedValue(mockSignal);
    (prisma.signal.update as jest.Mock).mockResolvedValue({ ...mockSignal, status: 'TIMED_OUT' });
    (prisma.resolution.create as jest.Mock).mockResolvedValue({
      signalId: 'sig-123',
      resolution: 'TIMED_OUT',
      chosenOptionId: 'ABORT_ACTION'
    });

    await processTimeoutJob(mockJob);

    // Verify it fetched the signal
    expect(prisma.signal.findUnique).toHaveBeenCalledWith({
      where: { id: 'sig-123' },
      include: { resolution: true }
    });

    // Verify it updated the signal status to TIMED_OUT
    expect(prisma.signal.update).toHaveBeenCalledWith({
      where: { id: 'sig-123' },
      data: { status: 'TIMED_OUT' }
    });

    // Verify it created a resolution with the safe default 'ABORT_ACTION'
    expect(prisma.resolution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        signalId: 'sig-123',
        resolution: 'TIMED_OUT',
        chosenOptionId: 'ABORT_ACTION'
      })
    });

    // Verify it broadcasted the fail-closed decision over WebSocket
    expect(emitToOrg).toHaveBeenCalledWith('org-456', 'signal:resolved', expect.objectContaining({
      signalId: 'sig-123'
    }));

    // Verify it queued a notification
    expect(notificationQueue.add).toHaveBeenCalledWith({
      type: 'TIMEOUT',
      signalId: 'sig-123'
    });
  });

  it('should not do anything if the signal is already RESOLVED', async () => {
    const mockJob = { data: { signalId: 'sig-123' } } as any;

    const mockSignal = {
      id: 'sig-123',
      status: 'RESOLVED'
    };

    (prisma.signal.findUnique as jest.Mock).mockResolvedValue(mockSignal);

    await processTimeoutJob(mockJob);

    expect(prisma.signal.update).not.toHaveBeenCalled();
    expect(prisma.resolution.create).not.toHaveBeenCalled();
  });
});
