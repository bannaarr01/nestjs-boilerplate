import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetFailedJobsDto {
  @ApiPropertyOptional({
     description: 'Maximum failed jobs to return (1-100)',
     example: 20,
     default: 20
  })
  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
     limit: number = 20;
}

