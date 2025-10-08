import {
  ExecutionContext,
  Injectable,
  LoggerService,
  Scope,
} from "@nestjs/common";
import { MemoryDbService } from "./memory-db.service";
import { defaultTable } from "../defaults";
import { LogModuleOptions, LogType } from "../types";
import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntitySchema,
} from "typeorm";
import { createLogEntity } from "../entities/log.entity";

@Injectable({ scope: Scope.TRANSIENT })
export class LogService implements LoggerService {
  static connection: DataSource;
  static Log: EntitySchema = createLogEntity(defaultTable);

  constructor(private readonly memoryDbService: MemoryDbService) {}

  async connectDb(options: LogModuleOptions): Promise<DataSource> {
    LogService.Log = createLogEntity(
      options.database?.collection || options.database?.table || defaultTable
    );

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
    this.smartInsert({
      type: LogType.LOG,
      message,
      context,
    });
  }

  error(message: string, trace?: string, context?: ExecutionContext) {
    this.smartInsert({
      type: LogType.ERROR,
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: string) {
    this.smartInsert({
      type: LogType.WARN,
      message,
      context,
    });
  }

  debug(message: string, context?: string) {
    this.smartInsert({
      type: LogType.DEBUG,
      message,
      context,
    });
  }

  verbose(message: string, context?: string) {
    this.smartInsert({
      type: LogType.VERBOSE,
      message,
      context,
    });
  }

  async getAll(): Promise<any[]> {
    return this.getConnection().find(LogService.Log);
  }

  private async smartInsert(data: any): Promise<any> {
    const currentDate = new Date();

    const connection = this.getConnection();

    // find the same log in DB
    const log = await connection.findOne(LogService.Log, {
      where: {
        type: data.type,
        message: data.message,
      },
    });

    if (log) {
      return await connection.update(LogService.Log, log._id, {
        count: log.count + 1,
        updatedAt: currentDate,
      });
    }

    return await connection.insert(LogService.Log, {
      type: data.type,
      message: data.message,
      count: 1,
      createdAt: currentDate,
      updatedAt: currentDate,
    });
  }

  private getConnection(): EntityManager {
    return LogService.connection.manager || this.memoryDbService;
  }
}
