import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { BranchRepository } from './repositories/branch.repository';
import { EmployeeRepository } from './repositories/employee.repository';

@Module({
  imports: [PrismaModule],
  controllers: [BranchesController],
  providers: [BranchesService, BranchRepository, EmployeeRepository],
  exports: [BranchesService],
})
export class BranchesModule {}
