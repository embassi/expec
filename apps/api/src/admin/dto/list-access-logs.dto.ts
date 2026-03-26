import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const SCAN_RESULTS = ['granted', 'denied'] as const;

export class ListAccessLogsDto extends PaginationDto {
  /** Filter by scan outcome */
  @IsOptional()
  @IsIn(SCAN_RESULTS)
  result?: string;
}
