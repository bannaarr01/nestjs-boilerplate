import { ApiProperty } from '@nestjs/swagger';

export class AppInfoDto {
  @ApiProperty({ example: 'nestjs-boilerplate' })
     name: string;

  @ApiProperty({ example: '1.0.0' })
     version: string;

  @ApiProperty({ example: 'postgresql', enum: ['postgresql', 'mysql'] })
     dbClient: string;

  @ApiProperty({ example: false })
     redisEnabled: boolean;
}


