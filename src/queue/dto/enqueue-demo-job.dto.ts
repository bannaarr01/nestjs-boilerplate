import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EnqueueDemoJobDto {
  @ApiPropertyOptional({
     example: 'sample payload'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
     payload?: string;
}


