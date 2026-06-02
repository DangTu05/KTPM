import { Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Employee, Prisma } from '@prisma/client';
import { BranchRepository } from './repositories/branch.repository';
import { EmployeeRepository } from './repositories/employee.repository';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepo: BranchRepository,
    private readonly employeesRepo: EmployeeRepository,
  ) {}

  createBranch(dto: CreateBranchDto): Promise<Branch> {
    const data: Prisma.BranchCreateInput = {
      code: dto.code,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      addressLine: dto.addressLine,
      ward: dto.ward,
      district: dto.district,
      province: dto.province,
      country: dto.country ?? 'VN',
      isActive: dto.isActive ?? true,
    };

    return this.branchesRepo.create(data);
  }

  listBranches(query?: PaginationQueryDto): Promise<PaginatedResponse<Branch>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, limit))
      : 20;

    return this.branchesRepo.findMany({
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      page: safePage,
      limit: safeLimit,
    });
  }

  async getBranch(id: string): Promise<Branch> {
    const branch = await this.branchesRepo.findById(id);
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh');
    return branch;
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    await this.getBranch(id);
    return this.branchesRepo.update(id, dto);
  }

  async deleteBranch(id: string): Promise<Branch> {
    await this.getBranch(id);
    return this.branchesRepo.delete(id);
  }

  async createEmployee(
    branchId: string,
    dto: CreateEmployeeDto,
  ): Promise<Employee> {
    await this.getBranch(branchId);
    return this.employeesRepo.create(branchId, {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  async listEmployees(branchId: string): Promise<Employee[]> {
    await this.getBranch(branchId);
    return this.employeesRepo.findManyByBranch(branchId);
  }

  async updateEmployee(
    employeeId: string,
    dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.employeesRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên');
    return this.employeesRepo.update(employeeId, dto);
  }

  async deleteEmployee(employeeId: string): Promise<Employee> {
    const employee = await this.employeesRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên');
    return this.employeesRepo.delete(employeeId);
  }
}
