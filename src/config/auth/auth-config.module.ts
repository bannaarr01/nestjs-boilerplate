import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../../auth/auth.module';
import { DynamicModule, Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThrottleGuard } from '../../common/guards/throttle.guard';
import { ResourcePermissionGuard } from '../../common/guards/resource-permission.guard';

@Module({})
export class AuthConfigModule {
   static forRoot(): DynamicModule {
      return {
         module: AuthConfigModule,
         imports: [AuthModule],
         providers: [
            {
               provide: APP_GUARD,
               useClass: ApiKeyGuard
            },
            {
               provide: APP_GUARD,
               useClass: ThrottleGuard
            },
            {
               provide: APP_GUARD,
               useClass: JwtAuthGuard
            },
            {
               provide: APP_GUARD,
               useClass: RolesGuard
            },
            {
               provide: APP_GUARD,
               useClass: ResourcePermissionGuard
            }
         ],
         exports: [AuthModule]
      };
   }
}

