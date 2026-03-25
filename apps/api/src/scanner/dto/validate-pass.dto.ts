import { IsString, IsNotEmpty } from 'class-validator';

export class ValidatePassDto {
  @IsNotEmpty()
  @IsString()
  scanner_code: string;

  @IsNotEmpty()
  @IsString()
  pass_token: string;
}
