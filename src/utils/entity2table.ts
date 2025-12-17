import { EntitySchema, Table } from 'typeorm';
import { defaultTable } from '../defaults';

export function entity2table(entity: EntitySchema): Table {
  return new Table({
    name: entity.options.tableName || defaultTable,
    columns: Object.entries(entity.options.columns).map(([name, col]) => ({
      name,
      type: resolveColumnType(col?.type),
      isPrimary: !!col?.primary,
      isGenerated: !!col?.generated,
      generationStrategy: col?.generated ? 'increment' : undefined,
      isUnique: !!col?.unique,
      isNullable: !!col?.nullable,
      default: col?.default,
    })),
  });
}

function resolveColumnType(type: any): string {
  switch (type) {
    case String:
      return 'text';
    case Number:
      return 'int';
    case Date:
      return 'timestamp';
    case Boolean:
      return 'boolean';
    default:
      return 'text';
  }
}
