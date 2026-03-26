import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const ANNOUNCEMENT_STATUSES = ['published', 'draft', 'archived'] as const;

export class ListAnnouncementsDto extends PaginationDto {
  @IsOptional()
  @IsIn(ANNOUNCEMENT_STATUSES)
  status?: string;
}
