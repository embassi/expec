import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class RequestJoinDto {
  @IsUUID()
  community_id: string;

  @IsNotEmpty()
  @IsString()
  unit_code: string;
}
