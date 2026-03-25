import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceRequestDto {
  @IsUUID()
  community_id: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;
}
