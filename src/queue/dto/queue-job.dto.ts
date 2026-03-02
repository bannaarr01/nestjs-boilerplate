import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueueJobDto {
  @ApiProperty({ example: '27' })
  id: string;

  @ApiProperty({ example: 'demo' })
  name: string;

  @ApiProperty({ example: 'completed' })
  state: string;

  @ApiProperty({ example: 1 })
  attemptsMade: number;

  @ApiPropertyOptional({ example: { payload: 'sample payload', createdAt: '2026-03-03T00:00:00.000Z' } })
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ example: null, nullable: true })
  failedReason?: string | null;
}


