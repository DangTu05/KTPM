import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CloudinaryConfig } from 'src/configs';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [ConfigModule],
  controllers: [CloudinaryController],
  providers: [
    CloudinaryService,
    {
      provide: 'CLOUDINARY',
      useFactory: (configService: ConfigService) =>
        CloudinaryConfig(configService),
      inject: [ConfigService],
    },
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
