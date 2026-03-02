import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ApiResponse } from '../utils/api.util';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from './interfaces/auth-user.interface';
import { ApiVersion } from '../common/enums/api-version.enum';
import { Public } from '../common/decorators/public.decorator';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { ApiOperationAndResponses } from '../common/decorators/api-ops.decorator';
import { AuthenticatedUser } from '../common/decorators/authenticated-user.decorator';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Version } from '@nestjs/common';

@ApiTags('Auth')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
   constructor(
    private readonly authService: AuthService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

  @Public()
  @Post('login')
  @Version(ApiVersion.ONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperationAndResponses({
     summary: 'Login user',
     description: 'Simple boilerplate login endpoint for local/dev use.',
     responseModel: AuthResponseDto,
     responseDescriptions: {
        [HttpStatus.OK]: 'Returns access token and authenticated user',
        [HttpStatus.UNAUTHORIZED]: 'Invalid credentials'
     }
  })
   async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
      try {
         const data = await this.authService.login(loginDto);
         return new ApiResponse(data);
      } catch (error) {
         this.errorHandler.handleControllerError(error, AuthController, '.login');
      }
   }

  @Get('me')
  @Version(ApiVersion.ONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperationAndResponses({
     summary: 'Get authenticated user',
     description: 'Returns user data from JWT payload.',
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

