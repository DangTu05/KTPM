import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentType,
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { Prisma as PrismaNs } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersRepository } from './repositories/orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { OrderEventsProducer } from './queues/order-events.producer';
import type { PaginatedResponse } from './repositories/orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepo: OrdersRepository,
    private readonly orderEventsProducer: OrderEventsProducer,
  ) {}

  async create(dto: CreateOrderDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh');

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        branchId: dto.branchId,
        isAvailable: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều món không khả dụng tại chi nhánh này',
      );
    }

    const byId = new Map(menuItems.map((m) => [m.id, m]));

    const subtotal = dto.items.reduce((sum, item) => {
      const m = byId.get(item.menuItemId)!;
      return sum + Number(m.price) * item.quantity;
    }, 0);

    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const shippingFee = dto.shippingFee ?? 0;

    const total = subtotal - discount + tax + shippingFee;
    if (total < 0) throw new BadRequestException('Tổng tiền không được âm');

    const data: Prisma.OrderCreateInput = {
      branch: { connect: { id: dto.branchId } },
      ...(dto.customerId
        ? { customer: { connect: { id: dto.customerId } } }
        : {}),

      channel: dto.channel ?? OrderChannel.WEB,
      status: OrderStatus.PENDING,
      fulfillment: dto.fulfillment ?? FulfillmentType.DELIVERY,

      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.UNPAID,

      customerName: dto.customerName,
      customerPhone: dto.customerPhone,

      deliveryAddressLine: dto.deliveryAddressLine,
      deliveryWard: dto.deliveryWard,
      deliveryDistrict: dto.deliveryDistrict,
      deliveryProvince: dto.deliveryProvince,
      deliveryNote: dto.deliveryNote,

      subtotal: new PrismaNs.Decimal(subtotal),
      discount: new PrismaNs.Decimal(discount),
      tax: new PrismaNs.Decimal(tax),
      shippingFee: new PrismaNs.Decimal(shippingFee),
      total: new PrismaNs.Decimal(total),

      items: {
        create: dto.items.map((i) => {
          const m = byId.get(i.menuItemId)!;
          const unitPrice = Number(m.price);
          const lineTotal = unitPrice * i.quantity;
          return {
            menuItem: { connect: { id: m.id } },
            itemName: m.name,
            unitPrice: new PrismaNs.Decimal(unitPrice),
            quantity: i.quantity,
            lineTotal: new PrismaNs.Decimal(lineTotal),
            note: i.note,
          };
        }),
      },
    };

    const order = await this.ordersRepo.create(data);

    this.orderEventsProducer.addOrderCreatedInBackground({
      orderId: order.id,
      branchId: order.branchId,
      customerId: order.customerId ?? undefined,
      total: order.total.toString(),
      itemCount: dto.items.length,
      placedAt: order.placedAt.toISOString(),
    });

    return order;
  }

  async get(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  list(query: {
    branchId?: string;
    status?: OrderStatus;
    customerId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, limit))
      : 20;

    return this.ordersRepo.findMany({
      branchId: query.branchId,
      status: query.status,
      customerId: query.customerId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      page: safePage,
      limit: safeLimit,
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.get(id);
    const data: Prisma.OrderUpdateInput = {
      status: dto.status,
      ...(dto.status === OrderStatus.COMPLETED
        ? { completedAt: new Date() }
        : {}),
    };
    return this.ordersRepo.update(id, data);
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    await this.get(id);
    const data: Prisma.OrderUpdateInput = {
      paymentStatus: dto.paymentStatus,
      ...(dto.paymentMethod ? { paymentMethod: dto.paymentMethod } : {}),
    };
    return this.ordersRepo.update(id, data);
  }
}
