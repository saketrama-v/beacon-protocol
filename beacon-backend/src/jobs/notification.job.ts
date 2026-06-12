import { Job } from 'bull';
import prisma from '../db/prisma';
import { sendSlackNotification, sendEmailNotification, sendGenericWebhook } from '../services/notification.service';

export const processNotificationJob = async (job: Job) => {
  const { type, signalId } = job.data;
  console.log(`Processing notification job for signal: ${signalId}`);

  try {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { agent: true }
    });

    if (!signal) return;

    const webhooks = await prisma.webhook.findMany({
      where: { orgId: signal.orgId, isActive: true }
    });

    for (const webhook of webhooks) {
      try {
        const config = webhook.config as any;
        if (webhook.type === 'SLACK') {
          await sendSlackNotification(config.url, signal);
        } else if (webhook.type === 'EMAIL') {
          await sendEmailNotification(config.email, signal);
        } else if (webhook.type === 'GENERIC_WEBHOOK') {
          await sendGenericWebhook(config.url, signal);
        }
        
        await prisma.notification.create({
          data: {
            signalId,
            channel: webhook.type,
            status: 'sent',
            sentAt: new Date()
          }
        });
      } catch (err: any) {
        await prisma.notification.create({
          data: {
            signalId,
            channel: webhook.type,
            status: 'failed',
            error: err.message
          }
        });
      }
    }
  } catch (error) {
    console.error('Notification Job failed', error);
  }
};
