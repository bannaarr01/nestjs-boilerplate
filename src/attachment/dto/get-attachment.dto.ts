import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAttachmentDto {
  @ApiProperty({
     example: '1f11fcf4-63fc-4e9c-9c3a-2f9e554f784f'
  })
  @IsUUID('4')
     id: string;
}


