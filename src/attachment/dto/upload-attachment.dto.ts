import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UploadAttachmentDto {
  @ApiProperty({
     example: 'loan_application',
     description: 'Logical domain owner of the attachment'
  })
  @IsString()
  @MinLength(2)
     entityType: string;

  @ApiProperty({
     example: 'app_123456',
     description: 'Unique identifier of the owner entity'
  })
  @IsString()
  @MinLength(1)
     entityId: string;

  @ApiPropertyOptional({
     example: 'Front side of the identity card'
  })
  @IsOptional()
  @IsString()
     description?: string;

  @ApiPropertyOptional({
     example: { source: 'portal', category: 'identity' },
     description: 'Optional attachment metadata'
  })
  @IsOptional()
  @IsObject()
     metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
     example: 3600,
     description: 'Signed URL lifetime in seconds (1 minute to 7 days)'
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(604800)
     urlExpiresInSeconds?: number;
}


