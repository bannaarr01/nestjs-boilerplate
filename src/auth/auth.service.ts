import { Injectable } from '@nestjs/common';
import { AuthUserDto } from './dto/auth-response.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class AuthService {
   constructor(
    private readonly errorHandler: ErrorHandlerService
   ) {}

   getAuthenticatedUser(user: AuthUser): AuthUserDto {
      try {
         const clientId = process.env.KEYCLOAK_CLIENT_ID || '';

         return {
            sub: user.sub,
            email: user.email || '',
            preferredUsername: user.preferred_username || '',
            name: user.name || '',
            realmRoles: user.realm_access?.roles || [],
            clientRoles: clientId ? user.resource_access?.[clientId]?.roles || [] : [],
            issuedAt: user.iat,
            expiresAt: user.exp
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AuthService, '.getAuthenticatedUser');
      }
   }
}
