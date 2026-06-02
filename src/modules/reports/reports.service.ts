import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type GroupBy = 'day' | 'week' | 'month';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(input?: string): Date | undefined {
    if (!input) return undefined;
    const d = new Date(input);
    if (Number.isNaN(d.getTime()))
      throw new BadRequestException('Ngày không hợp lệ');
    return d;
  }

  private groupByOrDefault(groupBy?: GroupBy): GroupBy {
    return groupBy ?? 'day';
  }

  async branchRevenue(
    branchId: string,
    params: { from?: string; to?: string; groupBy?: GroupBy },
  ) {
    const from = this.parseDate(params.from);
    const to = this.parseDate(params.to);
    const groupBy = this.groupByOrDefault(params.groupBy);

    const rows = await this.prisma.$queryRaw<
      Array<{
        period: Date;
        ordersCount: bigint;
        grossRevenue: Prisma.Decimal | null;
      }>
    >(
      Prisma.sql`
        SELECT
          date_trunc(${groupBy}, "completedAt") AS period,
          COUNT(*)::bigint AS "ordersCount",
          COALESCE(SUM(total), 0)::numeric AS "grossRevenue"
        FROM "Order"
        WHERE
          "branchId" = ${branchId}
          AND status = ${OrderStatus.COMPLETED}
          AND "completedAt" IS NOT NULL
          ${from ? Prisma.sql`AND "completedAt" >= ${from}` : Prisma.empty}
          ${to ? Prisma.sql`AND "completedAt" <= ${to}` : Prisma.empty}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    return rows.map((r) => ({
      period: r.period,
      ordersCount: Number(r.ordersCount),
      grossRevenue: r.grossRevenue ?? new Prisma.Decimal(0),
    }));
  }

  async systemRevenue(params: {
    from?: string;
    to?: string;
    groupBy?: GroupBy;
  }) {
    const from = this.parseDate(params.from);
    const to = this.parseDate(params.to);
    const groupBy = this.groupByOrDefault(params.groupBy);

    const rows = await this.prisma.$queryRaw<
      Array<{
        period: Date;
        ordersCount: bigint;
        grossRevenue: Prisma.Decimal | null;
      }>
    >(
      Prisma.sql`
        SELECT
          date_trunc(${groupBy}, "completedAt") AS period,
          COUNT(*)::bigint AS "ordersCount",
          COALESCE(SUM(total), 0)::numeric AS "grossRevenue"
        FROM "Order"
        WHERE
          status = ${OrderStatus.COMPLETED}
          AND "completedAt" IS NOT NULL
          ${from ? Prisma.sql`AND "completedAt" >= ${from}` : Prisma.empty}
          ${to ? Prisma.sql`AND "completedAt" <= ${to}` : Prisma.empty}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    return rows.map((r) => ({
      period: r.period,
      ordersCount: Number(r.ordersCount),
      grossRevenue: r.grossRevenue ?? new Prisma.Decimal(0),
    }));
  }
}
