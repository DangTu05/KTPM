import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ORDER_CREATED_JOB,
  ORDER_EVENTS_QUEUE,
  OrderCreatedJob,
} from './order-events.queue';

@Injectable()
export class OrderEventsProducer {
  private readonly logger = new Logger(OrderEventsProducer.name);

  constructor(
    @InjectQueue(ORDER_EVENTS_QUEUE)
    private readonly queue: Queue<OrderCreatedJob>,
  ) {}

  async addOrderCreated(job: OrderCreatedJob): Promise<void> {
    await this.queue.add(ORDER_CREATED_JOB, job, {
      jobId: `${ORDER_CREATED_JOB}-${job.orderId}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 3600,
      },
    });
  }

  addOrderCreatedInBackground(job: OrderCreatedJob): void {
    void this.addOrderCreated(job).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Không thể đưa job order.created vào hàng đợi: ${message}`,
      );
    });
  }
}
