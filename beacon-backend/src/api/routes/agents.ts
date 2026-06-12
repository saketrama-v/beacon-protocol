import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../db/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/agents (List all active agents in org)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const agents = await prisma.agent.findMany({
      where: { orgId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(agents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/agents (Register new agent)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const { name, framework } = req.body;

    if (!name || !framework) {
      res.status(400).json({ error: 'Missing name or framework' });
      return;
    }

    const apiKey = `beac_${uuidv4().replace(/-/g, '')}`;

    const agent = await prisma.agent.create({
      data: {
        name,
        framework,
        orgId,
        apiKey
      }
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/:id (Get agent details)
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const agent = await prisma.agent.findFirst({
      where: { id, orgId }
    });

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.json(agent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/agents/:id (Update agent)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;
    const { name, framework } = req.body;

    const agent = await prisma.agent.findFirst({ where: { id, orgId } });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: { name, framework }
    });

    res.json(updatedAgent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/agents/:id (Deactivate agent)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const agent = await prisma.agent.findFirst({ where: { id, orgId } });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    await prisma.agent.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Agent deactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/agents/:id/rotate-key
router.post('/:id/rotate-key', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const agent = await prisma.agent.findFirst({ where: { id, orgId } });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const newApiKey = `beac_${uuidv4().replace(/-/g, '')}`;
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: { apiKey: newApiKey }
    });

    res.json({ message: 'API key rotated', apiKey: updatedAgent.apiKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
