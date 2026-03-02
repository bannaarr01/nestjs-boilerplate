import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueueJobParamDto {
  @ApiProperty({ example: '27' })
  @IsString()
  @IsNotEmpty()
  jobId: string;
}


