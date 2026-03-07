import {
   AuthGuard,
   RoleGuard,
   ResourceGuard,
   TokenValidation,
   KeycloakConnectModule,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
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

   static authenticateWithKeycloak(): DynamicModule {
      const guards: GuardType[] = [ApiKeyGuard, AuthGuard, ResourceGuard, RoleGuard];

      if (process.env.THROTTLE_ENABLED !== 'false') {
         guards.unshift(ThrottleGuard);
      }

      return AuthConfigModule.registerGuardsAndImports(
         KeycloakConnectModule.register({
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

   static forRoot(): DynamicModule {
      return AuthConfigModule.authenticateWithKeycloak();
   }
}
