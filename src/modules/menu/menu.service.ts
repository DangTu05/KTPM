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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RedisService } from '../../redis/redis.service';

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
export class MenuService {
  constructor(
    private readonly categoriesRepo: MenuCategoryRepository,
    private readonly itemsRepo: MenuItemRepository,
    private readonly redis: RedisService,
  ) {}

  private normalizePagination(query?: PaginationQueryDto): {
    page: number;
    limit: number;
    skip: number;
    take: number;
  } {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, limit))
      : 20;
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

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

  private async getMenuItemsCacheVersion(branchId: string): Promise<number> {
    const versionKey = `menu:items:ver:branch:${branchId}`;
    const current = await this.redis.get(versionKey);
    if (current) {
      const version = Number(current);
      return Number.isFinite(version) ? version : 0;
    }

    await this.redis.set(versionKey, '0', 0);
    return 0;
  }

  private async bumpMenuItemsCacheVersion(branchId: string): Promise<void> {
    await this.redis.incr(`menu:items:ver:branch:${branchId}`);
  }

  async listCategories(
    branchId: string,
    query?: PaginationQueryDto,
  ): Promise<PaginatedResponse<MenuCategory>> {
    const { page, limit, skip, take } = this.normalizePagination(query);

    const [totalItems, data] = await Promise.all([
      this.categoriesRepo.countByBranch(branchId),
      this.categoriesRepo.findManyByBranchPaginated(branchId, { skip, take }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: totalPages !== 0 && page < totalPages,
        hasPrev: page > 1 && totalPages !== 0,
      },
    };
  }

  async updateCategory(
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.categoriesRepo.findById(categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    return this.categoriesRepo.update(categoryId, dto);
  }

  async deleteCategory(categoryId: string): Promise<MenuCategory> {
    const category = await this.categoriesRepo.findById(categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    return this.categoriesRepo.delete(categoryId);
  }

  createMenuItem(branchId: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    if (dto.categoryId === '') {
      throw new BadRequestException(
        'categoryId phải để trống hoặc là id hợp lệ',
      );
    }

    const created = this.itemsRepo.create(branchId, {
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: new PrismaNs.Decimal(dto.price),
      isAvailable: dto.isAvailable ?? true,
      categoryId: dto.categoryId,
    });

    void this.bumpMenuItemsCacheVersion(branchId);
    return created;
  }

  async listMenuItems(
    branchId: string,
    query?: PaginationQueryDto,
  ): Promise<PaginatedResponse<MenuItem>> {
    const { page, limit, skip, take } = this.normalizePagination(query);
    const version = await this.getMenuItemsCacheVersion(branchId);
    const cacheKey = `menu:items:v${version}:branch:${branchId}:page:${page}:limit:${limit}`;

    const cached =
      await this.redis.getJson<PaginatedResponse<MenuItem>>(cacheKey);
    if (cached) return cached;

    const [totalItems, data] = await Promise.all([
      this.itemsRepo.countByBranch(branchId),
      this.itemsRepo.findManyByBranchPaginated(branchId, { skip, take }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const result: PaginatedResponse<MenuItem> = {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: totalPages !== 0 && page < totalPages,
        hasPrev: page > 1 && totalPages !== 0,
      },
    };

    await this.redis.setJson(cacheKey, result);
    return result;
  }

  async updateMenuItem(
    itemId: string,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const item = await this.itemsRepo.findById(itemId);
    if (!item) throw new NotFoundException('Không tìm thấy món');

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

    const updated = await this.itemsRepo.update(itemId, data);
    void this.bumpMenuItemsCacheVersion(item.branchId);
    return updated;
  }

  async deleteMenuItem(itemId: string): Promise<MenuItem> {
    const item = await this.itemsRepo.findById(itemId);
    if (!item) throw new NotFoundException('Không tìm thấy món');

    const deleted = await this.itemsRepo.delete(itemId);
    void this.bumpMenuItemsCacheVersion(item.branchId);
    return deleted;
  }
}
