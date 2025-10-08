import { DataSourceOptions } from "typeorm";

export type LogModuleOptions = {
  path?: string;
  database?: DataSourceOptions & {
    host?: string;
    port?: string;
    table?: string;
    collection?: string;
  };
};
