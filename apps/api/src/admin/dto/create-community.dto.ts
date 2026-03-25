import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { CommunityType } from '@simsim/types';

export class CreateCommunityDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(CommunityType)
  type?: CommunityType;
}
