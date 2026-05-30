import { BadRequestException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

interface FileUploadOptions {
  fieldName?: string;
  maxSizeKB?: number;
  allowedMimeTypes?: string[];
  errorMessage?: string;
}

export function FileUploadInterceptor(options: FileUploadOptions = {}) {
  const {
    fieldName = 'file',
    maxSizeKB = 200,
    allowedMimeTypes = ['application/pdf'],
    errorMessage = 'File không hợp lệ!',
  } = options;

  return UseInterceptors(
    FileInterceptor(fieldName, {
      limits: {
        fileSize: maxSizeKB * 1024,
      },
      fileFilter: (req, file, cb) => {
        const isAllowed = allowedMimeTypes.includes(file.mimetype);

        if (!isAllowed) {
          return cb(new BadRequestException(errorMessage), false);
        }
        cb(null, true);
      },
    }),
  );
}

// Các interceptor cụ thể
export function PdfUploadInterceptor(fieldName = 'file', maxSizeKB = 1024) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: ['application/pdf'],
    errorMessage: 'Chỉ được upload file PDF!',
  });
}

export function ImageUploadInterceptor(fieldName = 'file', maxSizeKB = 5120) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    errorMessage: 'Chỉ được upload ảnh JPG, PNG, WEBP!',
  });
}

export function ExcelUploadInterceptor(fieldName = 'file', maxSizeKB = 10240) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    errorMessage: 'Chỉ được upload file Excel (.xls, .xlsx)!',
  });
}

export function WordUploadInterceptor(fieldName = 'file', maxSizeKB = 10240) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    errorMessage: 'Chỉ được upload file Word (.doc, .docx)!',
  });
}

export function AudioUploadInterceptor(fieldName = 'file', maxSizeKB = 51200) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/webm',
    ],
    errorMessage: 'Chỉ được upload file audio (MP3, WAV, OGG, M4A, WebM)!',
  });
}

export function VideoUploadInterceptor(fieldName = 'file', maxSizeKB = 512000) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
    ],
    errorMessage:
      'Chỉ được upload file video (MP4, WebM, OGG, QuickTime, AVI)!',
  });
}
export function MediaUploadInterceptor(fieldName = 'file', maxSizeKB = 512000) {
  return FileUploadInterceptor({
    fieldName,
    maxSizeKB,
    allowedMimeTypes: [
      // Images
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/webm',
      // Video
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
    ],
    errorMessage: 'Chỉ được upload file media (ảnh, audio, video)!',
  });
}
