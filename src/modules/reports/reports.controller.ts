import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('branches/:branchId/revenue')
  branchRevenue(
    @Param('branchId') branchId: string,
    @Query() query: RevenueQueryDto,
  ) {
    return this.service.branchRevenue(branchId, query);
  }

  @Get('system/revenue')
  systemRevenue(@Query() query: RevenueQueryDto) {
    return this.service.systemRevenue(query);
  }
}
