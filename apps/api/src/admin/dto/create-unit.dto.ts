import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateUnitDto {
  @IsUUID()
  community_id: string;

  @IsNotEmpty()
  @IsString()
  unit_code: string;

  @IsOptional()
  @IsString()
  unit_type?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  building?: string;
}
