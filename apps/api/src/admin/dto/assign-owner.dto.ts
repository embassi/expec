import { IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class AssignOwnerDto {
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_number must be in international format, e.g. +201001234567' })
  phone_number: string;

  @IsUUID()
  unit_id: string;
}
