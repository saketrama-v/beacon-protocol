import { Job } from 'bull';
import prisma from '../db/prisma';
import { emitToOrg } from '../services/websocket.service';
import { notificationQueue } from '../services/queue.service';

export const processTimeoutJob = async (job: Job) => {
  const { signalId } = job.data;
  console.log(`Processing timeout for signal: ${signalId}`);

  try {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { resolution: true }
    });

    if (!signal) return;

    if (signal.status === 'PENDING' || signal.status === 'ACKNOWLEDGED') {
      const decisionNeeded = signal.decisionNeeded as any;
      const defaultOption = decisionNeeded.default_if_timeout;

      const result = await prisma.$transaction(async (tx) => {
        const updatedSignal = await tx.signal.update({
          where: { id: signalId },
          data: { status: 'TIMED_OUT' }
        });

        const resolution = await tx.resolution.create({
          data: {
            signalId,
            resolution: 'TIMED_OUT',
            chosenOptionId: defaultOption,
            resolutionTimeMs: new Date().getTime() - signal.receivedAt.getTime()
          }
        });

        return { updatedSignal, resolution };
      });

      // Emit over WebSocket
      emitToOrg(signal.orgId, 'signal:resolved', {
        signalId,
        resolution: result.resolution
      });

      // Queue notification
      await notificationQueue.add({
        type: 'TIMEOUT',
        signalId
      });

      console.log(`Signal ${signalId} timed out and auto-resolved to ${defaultOption}`);
    }
  } catch (error) {
    console.error(`Failed to process timeout for ${signalId}`, error);
  }
};
