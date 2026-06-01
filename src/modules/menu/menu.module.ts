import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { MenuItemRepository } from './repositories/menu-item.repository';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MenuController],
  providers: [MenuService, MenuCategoryRepository, MenuItemRepository],
})
export class MenuModule {}
