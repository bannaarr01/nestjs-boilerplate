import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueueHealthDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: true })
  healthy: boolean;

  @ApiProperty({ example: 'ready' })
  status: string;

  @ApiProperty({ example: 'general' })
  queueName: string;

  @ApiPropertyOptional({ example: 'Connection refused' })
  errorMessage?: string;
}


