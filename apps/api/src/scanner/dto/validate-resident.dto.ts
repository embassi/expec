import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateResidentDto {
  @IsNotEmpty()
  @IsString()
  scanner_code: string;

  @IsNotEmpty()
  @IsString()
  qr_token: string;
}
