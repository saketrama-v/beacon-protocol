import { Router, Response } from 'express';
import prisma from '../../db/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/dashboard/signals
router.get('/signals', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const { status, urgency, agentId, page = '1', limit = '20' } = req.query;

    const whereClause: any = { orgId };

    if (status) whereClause.status = status;
    if (urgency) whereClause.urgency = urgency;
    if (agentId) whereClause.agentId = agentId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where: whereClause,
        include: { agent: { select: { name: true, framework: true } }, resolution: true },
        orderBy: [{ urgency: 'desc' }, { receivedAt: 'desc' }],
        skip,
        take
      }),
      prisma.signal.count({ where: whereClause })
    ]);

    res.json({
      data: signals,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;

    const [totalSignals, pendingSignals, timedOutSignals, avgResTime] = await Promise.all([
      prisma.signal.count({ where: { orgId } }),
      prisma.signal.count({ where: { orgId, status: 'PENDING' } }),
      prisma.signal.count({ where: { orgId, status: 'TIMED_OUT' } }),
      prisma.resolution.aggregate({
        where: { signal: { orgId } },
        _avg: { resolutionTimeMs: true }
      })
    ]);

    const activeAgents = await prisma.agent.count({ where: { orgId, isActive: true } });

    res.json({
      totalSignals,
      pendingSignals,
      timedOutSignals,
      activeAgents,
      averageResolutionTimeMs: avgResTime._avg.resolutionTimeMs || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
