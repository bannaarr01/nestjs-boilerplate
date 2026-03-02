import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';

export class DatabaseSeeder extends Seeder {
   async run(_entityManager: EntityManager): Promise<void> {
      // Register project seeders here.
      // Example:
      // return this.call(_entityManager, [UserSeeder, RoleSeeder]);
   }
}


