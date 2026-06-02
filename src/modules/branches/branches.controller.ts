import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.service.createBranch(dto);
  }

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.listBranches(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getBranch(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.service.updateBranch(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteBranch(id);
  }

  // Employees under branch
  @Post(':branchId/employees')
  createEmployee(
    @Param('branchId') branchId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.service.createEmployee(branchId, dto);
  }

  @Get(':branchId/employees')
  listEmployees(@Param('branchId') branchId: string) {
    return this.service.listEmployees(branchId);
  }

  @Patch('employees/:employeeId')
  updateEmployee(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.updateEmployee(employeeId, dto);
  }

  @Delete('employees/:employeeId')
  deleteEmployee(@Param('employeeId') employeeId: string) {
    return this.service.deleteEmployee(employeeId);
  }
}
