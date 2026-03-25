import { IsPhoneNumber, IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { RelationshipType } from '@simsim/types';

export class AddMemberDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone_number: string;

  @IsEnum(RelationshipType)
  relationship_type: RelationshipType;

  @IsUUID()
  community_id: string;

  @IsUUID()
  unit_id: string;
}
