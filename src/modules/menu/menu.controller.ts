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
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('branches/:branchId/menu')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  // Categories
  @Post('categories')
  createCategory(
    @Param('branchId') branchId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.createCategory(branchId, dto);
  }

  @Get('categories')
  listCategories(
    @Param('branchId') branchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listCategories(branchId, query);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(categoryId, dto);
  }

  @Delete('categories/:categoryId')
  deleteCategory(@Param('categoryId') categoryId: string) {
    return this.service.deleteCategory(categoryId);
  }

  // Items
  @Post('items')
  createMenuItem(
    @Param('branchId') branchId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.service.createMenuItem(branchId, dto);
  }

  @Get('items')
  listMenuItems(
    @Param('branchId') branchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listMenuItems(branchId, query);
  }

  @Patch('items/:itemId')
  updateMenuItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.service.updateMenuItem(itemId, dto);
  }

  @Delete('items/:itemId')
  deleteMenuItem(@Param('itemId') itemId: string) {
    return this.service.deleteMenuItem(itemId);
  }
}
