import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateScannerDto {
  @IsUUID()
  community_id: string;

  @IsNotEmpty()
  @IsString()
  scanner_name: string;

  @IsNotEmpty()
  @IsString()
  scanner_code: string;

  @IsOptional()
  @IsString()
  location_label?: string;
}
