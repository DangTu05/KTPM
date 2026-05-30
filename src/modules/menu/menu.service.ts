import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MenuCategory, MenuItem, Prisma } from '@prisma/client';
import { Prisma as PrismaNs } from '@prisma/client';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly categoriesRepo: MenuCategoryRepository,
    private readonly itemsRepo: MenuItemRepository,
  ) {}

  createCategory(
    branchId: string,
    dto: CreateCategoryDto,
  ): Promise<MenuCategory> {
    return this.categoriesRepo.create(branchId, {
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
  }

  listCategories(branchId: string): Promise<MenuCategory[]> {
    return this.categoriesRepo.findManyByBranch(branchId);
  }

  async updateCategory(
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.categoriesRepo.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    return this.categoriesRepo.update(categoryId, dto);
  }

  async deleteCategory(categoryId: string): Promise<MenuCategory> {
    const category = await this.categoriesRepo.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    return this.categoriesRepo.delete(categoryId);
  }

  createMenuItem(branchId: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    if (dto.categoryId === '') {
      throw new BadRequestException('categoryId must be omitted or a valid id');
    }

    return this.itemsRepo.create(branchId, {
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: new PrismaNs.Decimal(dto.price),
      isAvailable: dto.isAvailable ?? true,
      categoryId: dto.categoryId,
    });
  }

  listMenuItems(branchId: string): Promise<MenuItem[]> {
    return this.itemsRepo.findManyByBranch(branchId);
  }

  async updateMenuItem(
    itemId: string,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const item = await this.itemsRepo.findById(itemId);
    if (!item) throw new NotFoundException('Menu item not found');

    const data: Prisma.MenuItemUpdateInput = {
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      isAvailable: dto.isAvailable,
      ...(dto.price !== undefined
        ? { price: new PrismaNs.Decimal(dto.price) }
        : {}),
      ...(dto.categoryId !== undefined
        ? dto.categoryId
          ? { category: { connect: { id: dto.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
    };

    return this.itemsRepo.update(itemId, data);
  }

  async deleteMenuItem(itemId: string): Promise<MenuItem> {
    const item = await this.itemsRepo.findById(itemId);
    if (!item) throw new NotFoundException('Menu item not found');
    return this.itemsRepo.delete(itemId);
  }
}
