import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApprovalStatus } from '@simsim/types';

export class ListMembershipsDto extends PaginationDto {
  @IsOptional()
  @IsIn(Object.values(ApprovalStatus))
  status?: ApprovalStatus;
}
