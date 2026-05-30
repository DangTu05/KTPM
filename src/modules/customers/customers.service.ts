import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomersRepository } from './repositories/customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  create(dto: CreateCustomerDto) {
    const data: Prisma.CustomerCreateInput = {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
    };
    return this.repo.create(data);
  }

  list() {
    return this.repo.findMany();
  }

  async get(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.get(id);
    const data: Prisma.CustomerUpdateInput = {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
    };
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.get(id);
    return this.repo.delete(id);
  }
}
