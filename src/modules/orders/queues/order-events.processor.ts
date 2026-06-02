import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { LoyaltyTxnType, Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ORDER_CREATED_JOB,
  ORDER_EVENTS_QUEUE,
  OrderCreatedJob,
} from './order-events.queue';

@Processor(ORDER_EVENTS_QUEUE)
export class OrderEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderEventsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<OrderCreatedJob>): Promise<void> {
    switch (job.name) {
      case ORDER_CREATED_JOB:
        await this.handleOrderCreated(job.data);
        return;
      default:
        this.logger.warn(`Job hàng đợi đơn hàng không hỗ trợ: ${job.name}`);
    }
  }

  private async handleOrderCreated(job: OrderCreatedJob): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: job.orderId },
      select: {
        id: true,
        branchId: true,
        customerId: true,
        total: true,
        subtotal: true,
        discount: true,
        placedAt: true,
        pointsEarned: true,
      },
    });

    if (!order) {
      this.logger.warn(
        `Bỏ qua order.created: không tìm thấy đơn hàng ${job.orderId}`,
      );
      return;
    }

    if (order.pointsEarned > 0) {
      this.logger.log(
        `Bỏ qua order.created: đơn hàng ${order.id} đã được xử lý trước đó`,
      );
      return;
    }

    const points = order.customerId
      ? Math.floor(Number(order.total) / 10000)
      : 0;
    const statDate = this.toStartOfDay(order.placedAt);
    const netRevenue = order.subtotal.sub(order.discount);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "BranchDailyStat" (
            id,
            "branchId",
            date,
            "ordersCount",
            "grossRevenue",
            "netRevenue",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${`stat_${order.id}`},
            ${order.branchId},
            ${statDate},
            1,
            ${order.total},
            ${netRevenue},
            NOW(),
            NOW()
          )
          ON CONFLICT ("branchId", date)
          DO UPDATE SET
            "ordersCount" = "BranchDailyStat"."ordersCount" + 1,
            "grossRevenue" = "BranchDailyStat"."grossRevenue" + EXCLUDED."grossRevenue",
            "netRevenue" = "BranchDailyStat"."netRevenue" + EXCLUDED."netRevenue",
            "updatedAt" = NOW()
        `,
      );

      if (order.customerId && points > 0) {
        const account = await tx.loyaltyAccount.upsert({
          where: { customerId: order.customerId },
          create: {
            customer: { connect: { id: order.customerId } },
            pointsBalance: 0,
            lifetimePoints: 0,
          },
          update: {},
        });

        const existingTxn = await tx.loyaltyTransaction.findFirst({
          where: {
            orderId: order.id,
            type: LoyaltyTxnType.EARN,
          },
        });

        if (!existingTxn) {
          await tx.loyaltyTransaction.create({
            data: {
              account: { connect: { id: account.id } },
              order: { connect: { id: order.id } },
              type: LoyaltyTxnType.EARN,
              points,
              note: 'Tích điểm từ hàng đợi order.created',
            },
          });

          await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: {
              pointsBalance: { increment: points },
              lifetimePoints: { increment: points },
            },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { pointsEarned: points },
      });
    });

    // this.logger.log(
    //   `Processed order.created orderId=${order.id} branchId=${order.branchId} total=${order.total.toString()} itemCount=${job.itemCount} points=${points}`,
    // );
  }

  private toStartOfDay(input: Date): Date {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
