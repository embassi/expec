import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsIn, IsNumber, IsString, Min, Max } from 'class-validator';

class RequestUploadUrlDto {
  @IsIn(['profile-photo', 'announcement-image'])
  type!: 'profile-photo' | 'announcement-image';

  @IsString()
  mime_type!: string;

  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size_bytes!: number;
}

@Controller('upload')
export class StorageController {
  constructor(private storage: StorageService) {}

  /**
   * POST /upload/sign
   * Returns a short-lived signed URL the client uses to upload directly to Supabase Storage.
   * The API never handles file bytes — only orchestrates access.
   */
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  async requestSignedUrl(
    @Body() dto: RequestUploadUrlDto,
    @CurrentUser() user: any,
  ) {
    const isProfilePhoto = dto.type === 'profile-photo';
    const bucket = isProfilePhoto
      ? StorageService.BUCKETS.PROFILE_PHOTOS
      : StorageService.BUCKETS.ANNOUNCEMENT_MEDIA;

    const allowedTypes = isProfilePhoto
      ? StorageService.ALLOWED_TYPES.PROFILE_PHOTO
      : StorageService.ALLOWED_TYPES.ANNOUNCEMENT_IMAGE;

    const maxSize = isProfilePhoto
      ? StorageService.MAX_SIZES.PROFILE_PHOTO
      : StorageService.MAX_SIZES.ANNOUNCEMENT_IMAGE;

    this.storage.validateUpload(dto.mime_type, dto.size_bytes, allowedTypes, maxSize);

    // Scope path to the uploading user to prevent path traversal
    const ext = dto.mime_type.split('/')[1] ?? 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { signedUrl } = await this.storage.createSignedUploadUrl(bucket, path);

    return {
      signed_url: signedUrl,
      path,
      bucket,
      // Convenience: the public URL the client should store after upload
      public_url: this.storage.getPublicUrl(bucket, path),
    };
  }
}
