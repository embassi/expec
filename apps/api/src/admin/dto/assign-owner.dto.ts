import { IsPhoneNumber, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignOwnerDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone_number: string;

  @IsUUID()
  unit_id: string;
}
