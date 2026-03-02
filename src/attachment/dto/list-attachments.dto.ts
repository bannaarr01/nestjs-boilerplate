import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ListAttachmentsDto {
  @ApiProperty({
     example: 'loan_application'
  })
  @IsString()
  @MinLength(2)
     entityType: string;

  @ApiProperty({
     example: 'app_123456'
  })
  @IsString()
  @MinLength(1)
     entityId: string;
}


