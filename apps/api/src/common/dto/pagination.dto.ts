import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base DTO for paginated list queries.
 * Extend this for per-endpoint filter DTOs.
 *
 * Usage:
 *   @Get('...')
 *   list(@Query() query: SomeFilterDto) {
 *     return this.service.list(query);
 *   }
 *
 * Response shape:
 *   { data: T[], total: number, limit: number, offset: number }
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

/** Wrap a page of results in the standard envelope */
export function paginate<T>(
  data: T[],
  total: number,
  query: PaginationDto,
): { data: T[]; total: number; limit: number; offset: number } {
  return { data, total, limit: query.limit, offset: query.offset };
}
