import { EntitySchema } from "typeorm";

export function createLogEntity(name: string) {
  return new EntitySchema({
    name,
    columns: {
      _id: {
        type: String,
        objectId: true,
        primary: true,
      },
      type: { type: String },
      message: { type: String },
      count: { type: Number, default: 1 },
      createdAt: { type: Date },
      updatedAt: { type: Date },
    },
  });
}
