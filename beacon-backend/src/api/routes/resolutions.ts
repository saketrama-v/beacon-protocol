import { Router, Response } from 'express';
import prisma from '../../db/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { emitToOrg } from '../../services/websocket.service';
import { timeoutQueue } from '../../services/queue.service';

const router = Router();
router.use(requireAuth);

// POST /api/v1/resolutions/:signalId
router.post('/:signalId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const signalId = req.params.signalId as string;
    const { resolution, chosenOptionId, instructions } = req.body;

    if (!resolution) {
      res.status(400).json({ error: 'Resolution is required' });
      return;
    }

    const signal = await prisma.signal.findFirst({
      where: { id: signalId, orgId },
      include: { resolution: true }
    });

    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    if (signal.status === 'RESOLVED' || signal.status === 'TIMED_OUT' || signal.status === 'CANCELLED') {
      res.status(400).json({ error: `Signal is already ${signal.status}` });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSignal = await tx.signal.update({
        where: { id: signalId },
        data: { status: 'RESOLVED' }
      });

      const resRecord = await tx.resolution.create({
        data: {
          signalId,
          resolution,
          chosenOptionId,
          instructions,
          resolvedById: req.user!.id,
          resolutionTimeMs: new Date().getTime() - signal.receivedAt.getTime()
        }
      });

      return { updatedSignal, resRecord };
    });

    // Cancel timeout job
    const job = await timeoutQueue.getJob(`timeout_${signalId}`);
    if (job) await job.remove();

    // Emit resolution to Agent (via ws) and Dashboard
    emitToOrg(orgId, 'signal:resolved', {
      signalId,
      resolution: result.resRecord
    });

    res.status(201).json(result.resRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
