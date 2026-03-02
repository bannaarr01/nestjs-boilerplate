import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'user-123' })
     sub: string;

  @ApiProperty({ example: 'admin@example.com' })
     email: string;

  @ApiProperty({ type: [String], example: ['admin'] })
     roles: string[];

  @ApiProperty({ type: [String], example: ['app:read', 'app:manage'] })
     permissions: string[];
}

export class AuthResponseDto {
  @ApiProperty()
     accessToken: string;

  @ApiProperty({ example: 3600 })
     expiresIn: number;

  @ApiProperty({ type: AuthUserDto })
     user: AuthUserDto;
}


