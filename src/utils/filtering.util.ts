import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsInt, IsOptional } from 'class-validator';

export class ApiPagination {
  @IsOptional()
  @ApiPropertyOptional({
     description: 'Number of items per page, default: 10',
     default: 10,
     minimum: 1,
     maximum: 100
  })
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value, 10) || 10)
  @Type(() => Number)
     limit: number = 10;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Number of records to skip, default: 0', default: 0 })
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value, 10) || 0)
  @Type(() => Number)
     offset: number = 0;
}

export class ApiFilter extends ApiPagination {
  @IsOptional()
  @ApiPropertyOptional({
     description: 'Sort by createdAt descending, default: true',
     default: true,
     type: Boolean
  })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
     isDescByCreatedAt?: boolean = true;
}

export class ApiFilterWithDate extends ApiFilter {
  @IsOptional()
  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
     createdDateFrom?: Date;

  @IsOptional()
  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
     createdDateTo?: Date;
}


