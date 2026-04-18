import {
   AuthGuard,
   RoleGuard,
   ResourceGuard,
   TokenValidation,
   KeycloakAuthModule,
} from 'nestjs-keycloak-auth';
import { APP_GUARD } from '@nestjs/core';
import { isKeycloakEnabled } from '../../utils/env.util';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ThrottleGuard } from '../../common/guards/throttle.guard';
import { CanActivate, DynamicModule, Module, Type } from '@nestjs/common';

type GuardType = Type<CanActivate>;

@Module({})
export class AuthConfigModule {
   private static registerGuardsAndImports(importModule: any, guards: GuardType[]): DynamicModule {
      return {
         module: AuthConfigModule,
         imports: [importModule],
         providers: guards.map((guard) => ({
            provide: APP_GUARD,
            useClass: guard,
         })),
         exports: [importModule],
      };
   }

   private static registerGuards(guards: GuardType[]): DynamicModule {
      return {
         module: AuthConfigModule,
         providers: guards.map((guard) => ({
            provide: APP_GUARD,
            useClass: guard,
         })),
      };
   }

   static authenticateWithKeycloak(): DynamicModule {
      const guards: GuardType[] = [ApiKeyGuard, AuthGuard, ResourceGuard, RoleGuard];

      if (process.env.THROTTLE_ENABLED !== 'false') {
         guards.unshift(ThrottleGuard);
      }

      return AuthConfigModule.registerGuardsAndImports(
         KeycloakAuthModule.register({
            authServerUrl: `${process.env.KEYCLOAK_BASE_URL}`,
            realm: process.env.KEYCLOAK_REALM,
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
            realmPublicKey: process.env.KEYCLOAK_PUBLIC_KEY || '',
            tokenValidation: TokenValidation.OFFLINE,
            bearerOnly: true,
         }),
         guards,
      );
   }

   static withoutAuth(): DynamicModule {
      const guards: GuardType[] = [ApiKeyGuard];

      if (process.env.THROTTLE_ENABLED !== 'false') {
         guards.unshift(ThrottleGuard);
      }

      return AuthConfigModule.registerGuards(guards);
   }

   static forRoot(): DynamicModule {
      if (isKeycloakEnabled()) {
         return AuthConfigModule.authenticateWithKeycloak();
      }

      return AuthConfigModule.withoutAuth();
   }
}
