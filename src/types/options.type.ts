import { DataSourceOptions } from "typeorm";

export type LogModuleOptions = {
  path?: string;
  key?: string; // access key
  join?: boolean; // merge the message duplicates
  maxRecords?: number; // max log records
  maxAge?: number; // in days
  maxSize?: number; // in megabytes
  database?: DataSourceOptions & {
    host?: string;
    port?: string;
    table?: string;
    collection?: string;
  };
  websocket?: {
    port?: number;
    namespace?: string;
    host?: string;
    secure?: boolean;
  };
};
