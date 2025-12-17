import { DataSourceOptions, EntitySchema } from 'typeorm';

export function createLogEntity(
  name: string,
  dbType: DataSourceOptions['type'] | 'memory'
) {
  return new EntitySchema({
    name,
    columns: {
      _id: {
        type: dbType === 'mongodb' ? String : Number,
        objectId: true,
        primary: true,
        generated: true,
      },
      type: { type: String },
      message: { type: String },
      count: { type: Number, default: 1 },
      context: { type: String, nullable: true },
      trace: { type: String, nullable: true },
      breadcrumbs: { type: String, nullable: true },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
  });
}
