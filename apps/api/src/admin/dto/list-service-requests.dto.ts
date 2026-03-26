import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const SERVICE_REQUEST_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export class ListServiceRequestsDto extends PaginationDto {
  @IsOptional()
  @IsIn(SERVICE_REQUEST_STATUSES)
  status?: string;
}
