import { format } from 'sql-formatter';
import { normalizeDbClient } from '../../utils/db.util';
import { TSMigrationGenerator } from '@mikro-orm/migrations';

type MigrationDiff = {
  up: string[];
  down: string[];
};

function parseCsvEnv(value?: string): string[] {
   if (!value) {
      return [];
   }

   return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => item.toLowerCase());
}

/**
 * Filters generated SQL migration diffs by optional table/schema allow-lists
 * and formats SQL by the selected database engine.
 *
 * Environment options:
 * - DB_MIGRATION_INCLUDED_TABLES=table_a,table_b
 * - DB_MIGRATION_EXCLUDED_SCHEMAS=schema_a,schema_b
 */
export class CustomMigrationGenerator extends TSMigrationGenerator {
   private readonly dbClient = normalizeDbClient(process.env.DB_CLIENT);
   private readonly includedTables = parseCsvEnv(process.env.DB_MIGRATION_INCLUDED_TABLES);
   private readonly excludedSchemas = parseCsvEnv(process.env.DB_MIGRATION_EXCLUDED_SCHEMAS);

   generateMigrationFile(className: string, diff: MigrationDiff): string {
      return super.generateMigrationFile(className, this.filterDiff(diff));
   }

   createStatement(sql: string, padLeft: number): string {
      const sqlLanguage = this.dbClient === 'postgresql' ? 'postgresql' : 'mysql';
      let formattedSql = format(sql, { language: sqlLanguage });

      if (this.dbClient === 'postgresql') {
         formattedSql = formattedSql.replace(/default\s+'NULL'/gi, 'default NULL').replace(/`([^`]+)`/g, '"$1"');
      }

      return super.createStatement(formattedSql.replace(/\n/g, ' '), padLeft);
   }

   private filterDiff(diff: MigrationDiff): MigrationDiff {
      return {
         up: diff.up.filter(sql => this.shouldIncludeSql(sql)),
         down: diff.down.filter(sql => this.shouldIncludeSql(sql))
      };
   }

   private shouldIncludeSql(sql: string): boolean {
      const normalizedSql = sql.toLowerCase();

      if (this.includedTables.length > 0) {
         const hasIncludedTable = this.includedTables.some(table => {
            return (
               normalizedSql.includes(`"${table}"`) ||
          normalizedSql.includes(`\`${table}\``) ||
          normalizedSql.includes(`.${table}`) ||
          normalizedSql.includes(` ${table}`)
            );
         });

         if (!hasIncludedTable) {
            return false;
         }
      }

      if (this.excludedSchemas.length > 0) {
         const usesExcludedSchema = this.excludedSchemas.some(schema => {
            return (
               normalizedSql.includes(`"${schema}".`) ||
          normalizedSql.includes(`\`${schema}\`.`) ||
          normalizedSql.includes(`${schema}.`)
            );
         });

         if (usesExcludedSchema) {
            return false;
         }
      }

      return true;
   }
}



