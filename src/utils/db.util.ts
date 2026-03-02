import { HttpStatus } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ErrorCode } from '../common/enums/error-code.enum';
import { CustomError } from '../common/classes/custom-error';
import { ErrorHandlerService } from '../common/services/error-handler.service';

export class DbUtils {
   static async findEntityOrFail<T>(
      entityClass: new () => T,
      condition: object,
      em: EntityManager,
      errorHandler: ErrorHandlerService
   ): Promise<T> {
      const entity = await em.findOne(entityClass, condition);

      if (!entity) {
         const entries = Object.entries(condition as Record<string, unknown>);
         const [key, value] = entries[0] || ['unknown', 'N/A'];

         errorHandler.throwCustomError(
            `${entityClass.name} with ${key}: ${JSON.stringify(value)} not found`,
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND
         );
      }

      return entity as T;
   }

   static throwIfNotFound(entity: unknown, type: string, identifier: string, errorCode?: ErrorCode): void {
      if (!entity) {
         const statusCode = identifier.includes('Not Found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
         const code =
        errorCode || (statusCode === HttpStatus.NOT_FOUND ? ErrorCode.RESOURCE_NOT_FOUND : ErrorCode.INVALID_INPUT);

         throw new CustomError(`Invalid ${type} ${identifier}`, statusCode, code);
      }
   }

   static async seedEntityData<T>(
      entityManager: EntityManager,
      entityClass: new () => T,
      seedData: Partial<T>[],
      options: {
      uniqueFields: (keyof T)[];
      skipCountCheck?: boolean;
      mergeStrategy?: 'ignore' | 'update';
    }
   ): Promise<void> {
      const { uniqueFields, skipCountCheck = false, mergeStrategy = 'ignore' } = options;

      if (!uniqueFields || uniqueFields.length === 0) {
         throw new Error('uniqueFields is required for seedEntityData');
      }

      await entityManager.transactional(async transactEm => {
         if (!skipCountCheck) {
            const existingCount = await transactEm.count(entityClass, {});
            if (existingCount === seedData.length) {
               return;
            }
         }

         for (const item of seedData) {
            const whereClause: Record<string, unknown> = {};

            for (const field of uniqueFields) {
               if (item[field] === undefined) {
                  throw new Error(
                     `Field "${String(field)}" is required for uniqueness check but is undefined in seed item: ${JSON.stringify(item)}`
                  );
               }
               whereClause[field as string] = item[field];
            }

            const existing = await transactEm.findOne(entityClass, whereClause as object);

            if (existing) {
               if (mergeStrategy === 'update') {
                  const existingRecord = existing as Record<string, unknown>;
                  const partialItem = item as Record<string, unknown>;
                  const hasChanges = Object.keys(partialItem).some(key => {
                     if (key === 'id') {
                        return false;
                     }

                     return existingRecord[key] !== partialItem[key];
                  });

                  if (hasChanges) {
                     Object.assign(existingRecord, partialItem);
                     transactEm.persist(existing);
                  }
               }
            } else {
               const entity = transactEm.create(entityClass, item);
               transactEm.persist(entity);
            }
         }

         await transactEm.flush();
      });
   }

   static async isTableEmpty(entityManager: EntityManager, entityClass: object): Promise<boolean> {
      const count = await entityManager.count(entityClass as never, {});
      return count === 0;
   }

   static getEntityRef<T>(entityManager: EntityManager, entityClass: new () => T, id: number | string): T {
      return entityManager.getReference(entityClass, id) as T;
   }
}


