import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { isKeycloakEnabled } from '../utils/env.util';
import { CommonModule } from '../common/common.module';

@Module({
   imports: [CommonModule],
   controllers: isKeycloakEnabled() ? [AuthController] : [],
   providers: [AuthService],
   exports: [AuthService],
})
export class AuthModule {}
