import { ApiProperty } from '@nestjs/swagger';

export class QueueMetricsDto {
  @ApiProperty({ example: 'general' })
  queueName: string;

  @ApiProperty({ example: 3 })
  waiting: number;

  @ApiProperty({ example: 1 })
  active: number;

  @ApiProperty({ example: 42 })
  completed: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ example: 0 })
  delayed: number;

  @ApiProperty({ example: false })
  paused: boolean;

  @ApiProperty({ example: 48 })
  total: number;
}


