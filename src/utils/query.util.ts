import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/enums/error-code.enum';
import { CustomError } from '../common/classes/custom-error';

type DateRangeTarget = Record<string, any>;

export class QueryUtil {
   static handleDateRange(
      target: DateRangeTarget,
      fromKey: string,
      toKey: string,
      errorMessage: string = `Please provide ${fromKey} when specifying ${toKey}.`
   ): void {
      if (target[toKey] && !target[fromKey]) {
         throw new CustomError(errorMessage, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
      }

      if (!target[fromKey]) {
         return;
      }

      const fromDate = this.parseDateOrThrow(target[fromKey], fromKey);
      const toDate = target[toKey]
         ? this.endOfDay(this.parseDateOrThrow(target[toKey], toKey))
         : this.endOfMonth(fromDate);

      target[fromKey] = this.formatDateTime(fromDate);
      target[toKey] = this.formatDateTime(toDate);
   }

   private static parseDateOrThrow(value: unknown, field: string): Date {
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) {
         throw new CustomError(`Invalid date value for ${field}`, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
      }
      return date;
   }

   private static endOfDay(date: Date): Date {
      const value = new Date(date);
      value.setHours(23, 59, 59, 999);
      return value;
   }

   private static endOfMonth(date: Date): Date {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
   }

   private static formatDateTime(date: Date): string {
      const pad = (value: number) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
   }
}


