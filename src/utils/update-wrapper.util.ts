export class UpdateWrapper<T extends object> {
   constructor(private readonly target: T) {}

   updateField<K extends keyof T>(field: K, newValue: T[K] | undefined): this {
      if (newValue !== undefined && newValue !== this.target[field]) {
         this.target[field] = newValue;
      }

      return this;
   }

   updateStringField<K extends keyof T>(field: K, newValue: string | undefined): this {
      if (newValue !== undefined) {
         this.target[field] = newValue as T[K];
      }

      return this;
   }

   updateDateField<K extends keyof T>(field: K, newValue: string | Date | undefined): this {
      if (newValue !== undefined) {
         const parsedDate = newValue instanceof Date ? newValue : new Date(newValue);
         this.target[field] = parsedDate as T[K];
      }

      return this;
   }

   updateJsonField<K extends keyof T>(field: K, newData: object | undefined): this {
      if (newData !== undefined) {
         const current = (this.target[field] as object | undefined) || {};
         this.target[field] = {
            ...current,
            ...newData
         } as T[K];
      }

      return this;
   }

   async updateResolvedField<K extends keyof T>(
      field: K,
      input: unknown,
      resolver: (input: unknown) => Promise<T[K] | undefined>
   ): Promise<this> {
      if (input !== undefined) {
         const resolved = await resolver(input);
         if (resolved !== undefined) {
            this.target[field] = resolved;
         }
      }

      return this;
   }

   getTarget(): T {
      return this.target;
   }
}
