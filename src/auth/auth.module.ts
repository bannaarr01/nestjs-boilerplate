import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { CommonModule } from '../common/common.module';
import { JwtStrategy } from './strategies/jwt.strategy';

function resolveJwtSecret(): string {
   const secret = process.env.JWT_SECRET;

   if (secret && secret.trim().length > 0) {
      return secret;
   }

   if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
      return 'test-only-jwt-secret';
   }

   throw new Error('JWT_SECRET is required');
}

@Module({
   imports: [
      CommonModule,
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({
         secret: resolveJwtSecret(),
         signOptions: {
            expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600)
         }
      })
   ],
   controllers: [AuthController],
   providers: [AuthService, JwtStrategy],
   exports: [AuthService, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}

