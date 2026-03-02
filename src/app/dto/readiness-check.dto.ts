import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DependencyHealthDto {
  @ApiProperty({ example: 'database' })
     name: string;

  @ApiProperty({ example: true })
     healthy: boolean;

  @ApiProperty({ example: 'up' })
     status: 'up' | 'down' | 'disabled';

  @ApiPropertyOptional({ example: 'Connection refused' })
     message?: string;
}

export class ReadinessCheckDto {
  @ApiProperty({ example: 'ok' })
     status: 'ok' | 'degraded';

  @ApiProperty({ example: '2026-03-02T18:00:00.000Z' })
     timestamp: string;

  @ApiProperty({ type: () => [DependencyHealthDto] })
     dependencies: DependencyHealthDto[];
}

