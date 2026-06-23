import { Router, Request, Response } from 'express';
import { validateSosPacket } from '../../lib/schema-validator';
import { calculateUrgency } from '../../lib/urgency-calculator';
import prisma from '../../db/prisma';
import { emitToOrg } from '../../services/websocket.service';
import { timeoutQueue } from '../../services/queue.service';

const router = Router();

// Middleware to authenticate Agent API Key
const requireAgentAuth = async (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { apiKey }
    });

    if (!agent || !agent.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    (req as any).agent = agent;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/signals (Ingest SOS)
router.post('/', requireAgentAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = (req as any).agent;
    const packet: any = req.body;

    const isValid = validateSosPacket(packet);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid SOS packet schema', details: validateSosPacket.errors });
      return;
    }

    // Auto-calculate urgency if not explicitly provided
    const urgency = calculateUrgency(packet);

    // Calculate expiration
    const timeoutSeconds = Number(packet.timeout_seconds) || 300;
    const receivedAt = new Date();
    const expiresAt = new Date(receivedAt.getTime() + timeoutSeconds * 1000);

    const signal = await prisma.signal.create({
      data: {
        id: String(packet.signal_id),
        protocolVersion: String(packet.protocol_version),
        agentId: agent.id,
        orgId: agent.orgId,
        urgency: urgency as import('@prisma/client').Urgency,
        confidenceScore: packet.confidence_score ? Number(packet.confidence_score) : null,
        triggerType: String(packet.trigger_type),
        contextSnapshot: packet.context_snapshot as any,
        decisionNeeded: packet.decision_needed as any,
        timeoutSeconds,
        metadata: packet.metadata || {},
        status: 'PENDING',
        receivedAt,
        expiresAt
      }
    });

    // Enqueue timeout job
    await timeoutQueue.add(
      { signalId: signal.id },
      { delay: timeoutSeconds * 1000, jobId: `timeout_${signal.id}` }
    );

    // Emit via WebSocket to Org
    emitToOrg(agent.orgId, 'signal:new', signal);

    res.status(202).json({
      signal_id: signal.id,
      status: signal.status,
      polling_url: `/api/v1/signals/${signal.id}/status`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/signals/:id/status (Agent polls for status)
router.get('/:id/status', requireAgentAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const agent = (req as any).agent;

    // Check wait parameter for long-polling
    const waitSeconds = Math.min(parseInt(req.query.wait as string) || 0, 30);

    let signal = await prisma.signal.findFirst({
      where: { id, agentId: agent.id },
      include: { resolution: true }
    });

    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    // Long polling logic
    if (signal.status === 'PENDING' && waitSeconds > 0) {
      const waitMs = waitSeconds * 1000;
      const start = Date.now();
      
      // Simple polling loop for demonstration (in production use Redis Pub/Sub or similar)
      while (Date.now() - start < waitMs) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        signal = await prisma.signal.findFirst({
          where: { id },
          include: { resolution: true }
        });
        if (signal && signal.status !== 'PENDING') {
          break;
        }
      }
    }

    res.json({
      status: signal?.status,
      resolution: signal?.resolution || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/signals/:id (Agent cancels SOS)
router.delete('/:id', requireAgentAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const agent = (req as any).agent;

    const signal = await prisma.signal.findFirst({ where: { id, agentId: agent.id } });
    
    if (!signal || signal.status !== 'PENDING') {
      res.status(400).json({ error: 'Signal cannot be cancelled' });
      return;
    }

    await prisma.signal.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Remove from timeout queue
    const job = await timeoutQueue.getJob(`timeout_${id}`);
    if (job) await job.remove();

    emitToOrg(agent.orgId, 'signal:resolved', { signalId: id, status: 'CANCELLED' });

    res.json({ message: 'Signal cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
