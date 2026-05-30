import { Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Employee, Prisma } from '@prisma/client';
import { BranchRepository } from './repositories/branch.repository';
import { EmployeeRepository } from './repositories/employee.repository';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

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

  listBranches(): Promise<Branch[]> {
    return this.branchesRepo.findMany();
  }

  async getBranch(id: string): Promise<Branch> {
    const branch = await this.branchesRepo.findById(id);
    if (!branch) throw new NotFoundException('Branch not found');
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
    if (!employee) throw new NotFoundException('Employee not found');
    return this.employeesRepo.update(employeeId, dto);
  }

  async deleteEmployee(employeeId: string): Promise<Employee> {
    const employee = await this.employeesRepo.findById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');
    return this.employeesRepo.delete(employeeId);
  }
}
