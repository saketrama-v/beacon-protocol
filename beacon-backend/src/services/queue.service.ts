import Queue from 'bull';
import { processTimeoutJob } from '../jobs/timeout.job';
import { processNotificationJob } from '../jobs/notification.job';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const timeoutQueue = new Queue('signal-timeouts', REDIS_URL);
export const notificationQueue = new Queue('notifications', REDIS_URL);

// Register Processors
timeoutQueue.process(processTimeoutJob);
notificationQueue.process(processNotificationJob);

console.log('Queues initialized');
