import { ApiProperty } from '@nestjs/swagger';
import { QueueMetricsDto } from './queue-metrics.dto';

export class SchedulerMetricsDto {
  @ApiProperty({ type: () => [QueueMetricsDto] })
     queueMetrics: QueueMetricsDto[];

  @ApiProperty({ example: 60000 })
     uptimeMs: number;

  @ApiProperty({ example: '2026-03-02T18:00:00.000Z' })
     lastHealthCheck: string;
}

