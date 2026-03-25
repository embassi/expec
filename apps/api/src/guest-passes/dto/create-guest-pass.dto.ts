import { IsPhoneNumber, IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { PassType } from '@simsim/types';

export class CreateGuestPassDto {
  @IsNotEmpty()
  @IsString()
  guest_name: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  guest_phone: string;

  @IsEnum(PassType)
  pass_type: PassType;

  @IsUUID()
  community_id: string;
}
