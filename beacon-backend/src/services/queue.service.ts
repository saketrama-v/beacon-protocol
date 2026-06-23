import Queue from 'bull';
import { processTimeoutJob } from '../jobs/timeout.job';
import { processNotificationJob } from '../jobs/notification.job';

const REDIS_URL = process.env.REDIS_URL;

const mockQueue = {
  add: async () => console.warn('[Queue] REDIS_URL not set. Skipping job.'),
  getJob: async () => null,
  process: () => {},
} as unknown as Queue.Queue;

export const timeoutQueue = REDIS_URL ? new Queue('signal-timeouts', REDIS_URL) : mockQueue;
export const notificationQueue = REDIS_URL ? new Queue('notifications', REDIS_URL) : mockQueue;

if (REDIS_URL) {
  timeoutQueue.process(processTimeoutJob);
  notificationQueue.process(processNotificationJob);
  console.log('Queues initialized with Redis');
} else {
  console.warn('WARNING: REDIS_URL not provided. Queue functionality (timeouts) is disabled.');
}
