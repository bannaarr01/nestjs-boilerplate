import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty({ example: '1f11fcf4-63fc-4e9c-9c3a-2f9e554f784f' })
     id: string;

  @ApiProperty({ example: 'loan_application' })
     entityType: string;

  @ApiProperty({ example: 'app_123456' })
     entityId: string;

  @ApiProperty({ example: 'identity-card-front.jpg' })
     originalFileName: string;

  @ApiProperty({ example: 'loan_application/1f11fcf4-63fc-4e9c-9c3a-2f9e554f784f.jpg' })
     storageKey: string;

  @ApiProperty({ example: 'image/jpeg' })
     mimeType: string;

  @ApiProperty({ example: 241231 })
     fileSize: number;

  @ApiPropertyOptional({
     example: 'd2b2f7df7096f2f2b54f746d70913f8f8e4c89b37f6f8f9e2e6e8193b2f6f7f2'
  })
     checksum?: string;

  @ApiPropertyOptional({ example: 'Front side of ID card' })
     description?: string;

  @ApiPropertyOptional({
     example: { source: 'portal', category: 'identity' }
  })
     metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2026-03-02T12:00:00.000Z' })
     createdAt: string;

  @ApiPropertyOptional({ example: 'https://example.com/signed-url' })
     signedUrl?: string;
}


