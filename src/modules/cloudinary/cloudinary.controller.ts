import { Body, Controller, Delete, Post, UploadedFile } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';
import { MediaUploadInterceptor } from './cloudinary.interceptor';

@Controller('cloudinaries')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('media')
  @MediaUploadInterceptor()
  async uploadImages(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    return this.cloudinaryService.uploadMedia(file, folder);
  }
}
