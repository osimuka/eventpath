import { Worker } from 'bullmq';
import { Redis } from 'redis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

const worker = new Worker(
  'event-processing',
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);
    // Process event
    await processEvent(job.data);
  },
  { connection: redis }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

async function processEvent(data: Record<string, unknown>) {
  // Implement event processing logic
  // - Store event in database
  // - Update funnel progress
  // - Check for anomalies
}

console.log('Worker started');
