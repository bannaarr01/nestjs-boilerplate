import { Module } from '@nestjs/common';
import { LoggingModule } from '../logging/logging.module';
import { ErrorHandlerService } from './services/error-handler.service';

@Module({
   imports: [LoggingModule],
   providers: [ErrorHandlerService],
   exports: [ErrorHandlerService, LoggingModule]
})
export class CommonModule {}


