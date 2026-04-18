import Winston from 'winston';
import { join } from 'node:path';
import 'winston-daily-rotate-file';
import { mkdirSync } from 'node:fs';
import { Injectable } from '@nestjs/common';
import { getRequestId } from './request-context';

@Injectable()
export class LoggingService {
   private readonly logger: Winston.Logger;

   private readonly appLogTransport = new Winston.transports.DailyRotateFile({
      filename: 'logs/applications/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d'
   });

   private readonly errorLogTransport = new Winston.transports.DailyRotateFile({
      filename: 'logs/errors/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'error'
   });

   private readonly exceptionLogTransport = new Winston.transports.DailyRotateFile({
      filename: 'logs/exceptions/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d'
   });

   constructor() {
      this.ensureLogDirectories();

      this.logger = Winston.createLogger({
         level: 'http',
         format: Winston.format.combine(
            Winston.format.timestamp(),
            Winston.format.printf(({ level, message, label, timestamp }) => {
               const reqId = getRequestId();
               const prefix = reqId ? `[${reqId}] ` : '';
               return `${timestamp} ${prefix}[${label || 'APP'}] ${level}: ${message}`;
            })
         ),
         transports: [
            new Winston.transports.Console({ handleExceptions: true }),
            this.appLogTransport,
            this.errorLogTransport
         ],
         exceptionHandlers: [this.exceptionLogTransport],
         exitOnError: false
      });
   }

   getLogger(): Winston.Logger {
      return this.logger;
   }

   private ensureLogDirectories(): void {
      const directories = [
         join(process.cwd(), 'logs'),
         join(process.cwd(), 'logs', 'applications'),
         join(process.cwd(), 'logs', 'errors'),
         join(process.cwd(), 'logs', 'exceptions')
      ];

      directories.forEach(directory => {
         mkdirSync(directory, { recursive: true });
      });
   }
}

