import { Router, Response } from 'express';
import prisma from '../../db/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/webhooks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const webhooks = await prisma.webhook.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(webhooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/webhooks
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const { type, config, isActive } = req.body;

    if (!type || !config) {
      res.status(400).json({ error: 'Type and config are required' });
      return;
    }

    const webhook = await prisma.webhook.create({
      data: {
        orgId,
        type,
        config,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/webhooks/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;
    const { config, isActive } = req.body;

    const existing = await prisma.webhook.findFirst({ where: { id, orgId } });
    if (!existing) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: { config, isActive }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/webhooks/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.orgId;
    const id = req.params.id as string;

    const existing = await prisma.webhook.findFirst({ where: { id, orgId } });
    if (!existing) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    await prisma.webhook.delete({ where: { id } });

    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
