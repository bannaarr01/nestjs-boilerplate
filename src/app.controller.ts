import { AppService } from './app.service';
import { ApiResponse } from './utils/api.util';
import { AppInfoDto } from './app/dto/app-info.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from './common/decorators/roles.decorator';
import { HealthCheckDto } from './app/dto/health-check.dto';
import { ApiVersion } from './common/enums/api-version.enum';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { ReadinessCheckDto } from './app/dto/readiness-check.dto';
import { ErrorHandlerService } from './common/services/error-handler.service';
import { ApiOperationAndResponses } from './common/decorators/api-ops.decorator';
import { ResourcePermission } from './common/decorators/resource-permission.decorator';

@ApiTags('App')
@Controller({ version: ApiVersion.ONE })
@ApiBearerAuth()
export class AppController {
   constructor(
    private readonly appService: AppService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

  @Public()
  @Get()
  @ApiOperationAndResponses({
     summary: 'Get app info',
     description: 'Returns metadata about this boilerplate service.',
     responseModel: AppInfoDto,
     responseDescriptions: {
        [HttpStatus.OK]: 'Application metadata returned successfully'
     }
  })
   getInfo(): ApiResponse<AppInfoDto> {
      try {
         return new ApiResponse(this.appService.getInfo());
      } catch (error) {
         this.errorHandler.handleControllerError(error, AppController, '.getInfo');
      }
   }

  @Public()
  @Get('healthz')
  @ApiOperationAndResponses({
     summary: 'Health check',
     description: 'Returns liveness information for uptime checks.',
     responseModel: HealthCheckDto,
     responseDescriptions: {
        [HttpStatus.OK]: 'Service is healthy'
     }
  })
  healthCheck(): ApiResponse<HealthCheckDto> {
     try {
        return new ApiResponse({
           status: 'ok',
           timestamp: new Date().toISOString(),
           uptime: process.uptime()
        });
     } catch (error) {
        this.errorHandler.handleControllerError(error, AppController, '.healthCheck');
     }
  }

  @Public()
  @Get('readyz')
  @ApiOperationAndResponses({
     summary: 'Readiness check',
     description: 'Checks application dependencies (database and Redis).',
     responseModel: ReadinessCheckDto,
     responseDescriptions: {
        [HttpStatus.OK]: 'All required dependencies are healthy',
        [HttpStatus.SERVICE_UNAVAILABLE]: 'One or more required dependencies are unavailable'
     }
  })
  async readinessCheck(): Promise<ApiResponse<ReadinessCheckDto>> {
     try {
        const data = await this.appService.getReadiness();
        const statusCode = data.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        return new ApiResponse(data, {
           statusCode,
           message: data.status === 'ok' ? 'Ready' : 'Dependencies unavailable'
        });
     } catch (error) {
        this.errorHandler.handleControllerError(error, AppController, '.readinessCheck');
     }
  }

  @Get('secure')
  @Role('admin')
  @ResourcePermission('app', 'read')
  @ApiOperationAndResponses({
     summary: 'Secured test endpoint',
     description: 'Example endpoint protected by role and resource permission decorators.',
     responseModel: AppInfoDto,
     responseDescriptions: {
        [HttpStatus.OK]: 'Authorized app metadata',
        [HttpStatus.FORBIDDEN]: 'Missing required role or permission',
        [HttpStatus.UNAUTHORIZED]: 'Missing or invalid JWT token'
     }
  })
  getSecureInfo(): ApiResponse<AppInfoDto> {
     try {
        return new ApiResponse(this.appService.getInfo());
     } catch (error) {
        this.errorHandler.handleControllerError(error, AppController, '.getSecureInfo');
     }
  }
}

