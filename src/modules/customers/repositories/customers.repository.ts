import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  findMany(): Promise<Customer[]> {
    return this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  delete(id: string): Promise<Customer> {
    return this.prisma.customer.delete({ where: { id } });
  }
}
