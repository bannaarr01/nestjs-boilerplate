import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok' })
     status: string;

  @ApiProperty({ example: '2026-03-02T12:00:00.000Z' })
     timestamp: string;

  @ApiProperty({ example: 123.45 })
     uptime: number;
}


