import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'e8f17f36-2a6f-4d10-b36a-8df2e80ecf08' })
     sub: string;

  @ApiProperty({ example: 'admin@example.com' })
     email: string;

  @ApiProperty({ example: 'admin.user' })
     preferredUsername: string;

  @ApiProperty({ example: 'Admin User' })
     name: string;

  @ApiProperty({ type: [String], example: ['offline_access', 'uma_authorization'] })
     realmRoles: string[];

  @ApiProperty({ type: [String], example: ['admin'] })
     clientRoles: string[];

  @ApiProperty({ example: 1717853012 })
     issuedAt: number;

  @ApiProperty({ example: 1717856612 })
     expiresAt: number;
}

