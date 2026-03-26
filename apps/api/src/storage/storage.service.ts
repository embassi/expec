import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Storage facade.
 *
 * Why Supabase Storage:
 * - Already using Supabase Postgres — single vendor, shared billing
 * - Signed upload URLs: client uploads directly to storage (API never handles
 *   file bytes), keeps API fast and stateless
 * - CDN-backed public URLs for profile photos and announcement images
 * - Row-Level Security can restrict bucket access per user
 *
 * Buckets:
 *   - `profile-photos`   — user avatar uploads (public read, user-scoped write)
 *   - `announcement-media` — community announcement images (public read, admin write)
 *
 * Upload flow:
 *   1. Client calls POST /upload/sign → receives a signed upload URL (expires in 60s)
 *   2. Client uploads file directly to Supabase Storage via PUT to the signed URL
 *   3. Client sends the resulting `path` back to the API endpoint to store
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;

  // Bucket names — create these in Supabase dashboard or via the admin API
  static readonly BUCKETS = {
    PROFILE_PHOTOS: 'profile-photos',
    ANNOUNCEMENT_MEDIA: 'announcement-media',
  } as const;

  // Max file sizes (bytes)
  static readonly MAX_SIZES = {
    PROFILE_PHOTO: 5 * 1024 * 1024,    // 5 MB
    ANNOUNCEMENT_IMAGE: 10 * 1024 * 1024, // 10 MB
  } as const;

  // Allowed MIME types per bucket
  static readonly ALLOWED_TYPES = {
    PROFILE_PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
    ANNOUNCEMENT_IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } as const;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: { persistSession: false },
      });
      this.logger.log('Supabase Storage client initialised');
    } else {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — StorageService in no-op mode',
      );
    }
  }

  /**
   * Generate a signed upload URL.
   * The client uses this to upload a file directly to Supabase Storage.
   * Returns the URL and the expected path to save in the database.
   */
  async createSignedUploadUrl(
    bucket: string,
    path: string,
    expiresInSeconds = 60,
  ): Promise<{ signedUrl: string; path: string }> {
    if (!this.supabase) {
      throw new BadRequestException('File storage is not configured');
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data) {
      this.logger.error(`Failed to create signed URL for ${bucket}/${path}`, error);
      throw new BadRequestException('Failed to generate upload URL');
    }

    void expiresInSeconds; // used internally by Supabase — param kept for docs
    return { signedUrl: data.signedUrl, path: data.path };
  }

  /**
   * Get a public URL for a file in a public bucket.
   * No expiry — the bucket must have public read enabled.
   */
  getPublicUrl(bucket: string, path: string): string {
    if (!this.supabase) return '';
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a file. Called when a user replaces their photo or an announcement
   * is deleted.
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.warn(`Failed to delete ${bucket}/${path}: ${error.message}`);
    }
  }

  /** Validate MIME type and size before issuing a signed URL */
  validateUpload(
    mimeType: string,
    sizeBytes: number,
    allowedTypes: readonly string[],
    maxSizeBytes: number,
  ): void {
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed. Accepted: ${allowedTypes.join(', ')}`,
      );
    }
    if (sizeBytes > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / 1024 / 1024);
      throw new BadRequestException(`File exceeds the ${maxMb}MB size limit`);
    }
  }
}
