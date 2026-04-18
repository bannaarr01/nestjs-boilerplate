import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiVersion } from '../common/enums/api-version.enum';
import { UnwrapResponse } from '../common/decorators/wrap-response.decorator';
import { ApiOperationAndResponses } from '../common/decorators/api-ops.decorator';

@ApiTags('Monitoring')
@ApiSecurity('x-api-key')
@Controller({ path: 'monitoring', version: ApiVersion.ONE })
export class MonitoringController {
   constructor(private readonly monitoringService: MonitoringService) {}

   @Get('metrics')
   @UnwrapResponse()
   @ApiOperationAndResponses({
      summary: 'Get application metrics',
      description: 'Returns in-memory metrics snapshot. Protected by API key.',
      responseDescriptions: {
         [HttpStatus.OK]: 'Metrics snapshot returned',
         [HttpStatus.UNAUTHORIZED]: 'Invalid or missing API key',
      },
   })
   getMetrics(): Record<string, unknown> {
      return this.monitoringService.getSnapshot();
   }
}
