import { AuthService } from './auth.service';
import { ApiResponse } from '../utils/api.util';
import { AuthUserDto } from './dto/auth-response.dto';
import { AuthenticatedUser } from 'nestjs-keycloak-auth';
import { AuthUser } from './interfaces/auth-user.interface';
import { ApiVersion } from '../common/enums/api-version.enum';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { Controller, Get, HttpCode, HttpStatus, Version } from '@nestjs/common';
import { ApiOperationAndResponses } from '../common/decorators/api-ops.decorator';

@ApiTags('Auth')
@Controller('auth')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
export class AuthController {
   constructor(
      private readonly authService: AuthService,
      private readonly errorHandler: ErrorHandlerService
   ) {}

   @Get('me')
   @Version(ApiVersion.ONE)
   @HttpCode(HttpStatus.OK)
   @ApiOperationAndResponses({
      summary: 'Get authenticated user',
      description: 'Returns user data from the authenticated Keycloak token.',
      responseModel: AuthUserDto
   })
   getMe(@AuthenticatedUser() currentUser: AuthUser): ApiResponse<AuthUserDto> {
      try {
         const data = this.authService.getAuthenticatedUser(currentUser);
         return new ApiResponse(data);
      } catch (error) {
         this.errorHandler.handleControllerError(error, AuthController, '.getMe');
      }
   }
}
