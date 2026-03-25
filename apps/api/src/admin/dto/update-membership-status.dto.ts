import { IsEnum } from 'class-validator';
import { ApprovalStatus } from '@simsim/types';

export class UpdateMembershipStatusDto {
  @IsEnum(ApprovalStatus)
  approval_status: ApprovalStatus;
}
