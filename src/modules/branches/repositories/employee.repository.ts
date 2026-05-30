import { Injectable } from '@nestjs/common';
import { Employee, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    branchId: string,
    data: Prisma.EmployeeCreateWithoutBranchInput,
  ): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        ...data,
        branch: { connect: { id: branchId } },
      },
    });
  }

  findById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  findManyByBranch(branchId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    return this.prisma.employee.update({ where: { id }, data });
  }

  delete(id: string): Promise<Employee> {
    return this.prisma.employee.delete({ where: { id } });
  }
}
