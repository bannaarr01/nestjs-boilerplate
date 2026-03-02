import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueueTypeParamDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  @IsNotEmpty()
  queueType: string;
}

