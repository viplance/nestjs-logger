import {
  ExecutionContext,
  Injectable,
  LoggerService,
  Scope,
} from "@nestjs/common";
import { MemoryDbService } from "./memory-db.service";
import { defaultTable } from "../defaults";
import { LogModuleOptions, LogType } from "../types";
import { DataSource, DataSourceOptions, EntitySchema } from "typeorm";
import { createLogEntity } from "../entities/log.entity";

@Injectable({ scope: Scope.TRANSIENT })
export class LogService implements LoggerService {
  static connection: DataSource;
  static Log: EntitySchema;

  constructor(
    private readonly MemoryDbService: MemoryDbService // @InjectRepository(Log) // private readonly userRepository: Repository<Log>
  ) {}

  async connectDb(options: LogModuleOptions): Promise<DataSource> {
    const tableName =
      options.database?.collection || options.database?.table || "logs";

    LogService.Log = createLogEntity(tableName);

    const dataSourceOptions = {
      type: options.database?.type,
      database: options.database?.database,
      host: options.database?.host,
      port: options.database?.port,
      entities: [LogService.Log],
    } as DataSourceOptions;

    LogService.connection = new DataSource(dataSourceOptions);

    await LogService.connection.initialize();

    return LogService.connection;
  }

  log(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.LOG,
      message,
      context,
    });
  }

  error(message: string, trace?: string, context?: ExecutionContext) {
    this.smartInsert(defaultTable, {
      type: LogType.ERROR,
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.WARN,
      message,
      context,
    });
  }

  debug(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.DEBUG,
      message,
      context,
    });
  }

  verbose(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.VERBOSE,
      message,
      context,
    });
  }

  getAll(): any[] {
    return this.MemoryDbService.getMany(defaultTable);
  }

  private async smartInsert(table: string, data: any): Promise<any> {
    return await LogService.connection.manager.insert(LogService.Log, {
      type: data.type,
      message: data.message,
      count: 1,
    });
    // return this.MemoryDbService.insert(table, {
    //   ...data,
    //   count: 1,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // });
  }
}
