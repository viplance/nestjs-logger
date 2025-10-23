import { Injectable, LoggerService, Scope } from "@nestjs/common";
import { MemoryDbService } from "./memory-db.service";
import { defaultTable } from "../defaults";
import { Context, LogModuleOptions, LogType } from "../types";
import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntitySchema,
} from "typeorm";
import { createLogEntity } from "../entities/log.entity";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { setInterval } from "timers";
import { entity2table } from "../utils/entity2table";

@Injectable({ scope: Scope.TRANSIENT })
export class LogService implements LoggerService {
  static connection: DataSource;
  static options: LogModuleOptions;
  static Log: EntitySchema = createLogEntity(defaultTable, "memory");
  static timer: ReturnType<typeof setInterval>;

  breadcrumbs: any[] = [];

  constructor(private readonly memoryDbService: MemoryDbService) {}

  async connectDb(options: LogModuleOptions): Promise<DataSource> {
    LogService.Log = createLogEntity(
      options.database?.collection || options.database?.table || defaultTable,
      options.database?.type || "mongodb"
    );

    this.setOptions(options);

    const dataSourceOptions = {
      type: options.database?.type,
      database: options.database?.database,
      host: options.database?.host,
      port: options.database?.port,
      entities: [LogService.Log],
    } as DataSourceOptions;

    LogService.connection = new DataSource(dataSourceOptions);
    await LogService.connection.initialize();

    if (dataSourceOptions.type !== "mongodb") {
      // LogService.idName = "id";

      const queryRunner = LogService.connection.createQueryRunner();

      try {
        await queryRunner.connect();

        const table = entity2table(LogService.Log);

        await queryRunner.createTable(table, true);
      } finally {
        await queryRunner.release();
      }
    }

    if (LogService.timer) {
      clearInterval(LogService.timer);
    }

    LogService.timer = setInterval(this.checkRecords, 1000 * 60 * 60); // check one time per hour

    return LogService.connection;
  }

  setOptions(options: LogModuleOptions) {
    LogService.options = options;
  }

  addBreadcrumb(breadcrumb: any) {
    this.breadcrumbs.push(breadcrumb);
  }

  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  log(message: string, context?: ExecutionContextHost) {
    this.smartInsert({
      type: LogType.LOG,
      message,
      context,
    });
  }

  error(message: string, trace?: string, context?: ExecutionContextHost) {
    this.smartInsert({
      type: LogType.ERROR,
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: ExecutionContextHost) {
    this.smartInsert({
      type: LogType.WARN,
      message,
      context,
    });
  }

  debug(message: string, context?: ExecutionContextHost) {
    this.smartInsert({
      type: LogType.DEBUG,
      message,
      context,
    });
  }

  verbose(message: string, context?: ExecutionContextHost) {
    this.smartInsert({
      type: LogType.VERBOSE,
      message,
      context,
    });
  }

  async getAll(): Promise<any[]> {
    return this.getConnection().find(LogService.Log, {
      select: [
        "_id",
        "type",
        "message",
        "count",
        "createdAt",
        "updatedAt",
        "context",
        "trace",
        "breadcrumbs",
      ],
      order: { updatedAt: "DESC" },
    });
  }

  async delete(id: string) {
    return this.getConnection().delete(LogService.Log, id);
  }

  private async smartInsert(data: {
    type: LogType;
    message: string;
    context?: ExecutionContextHost;
    trace?: any;
  }): Promise<any> {
    const currentDate = new Date();

    const connection = this.getConnection();

    // find the same log in DB
    const log = await connection.findOne(LogService.Log, {
      where: {
        type: data.type,
        message: data.message,
      },
    });

    const context = data.context ? this.parseContext(data.context) : undefined;

    if (log) {
      return await connection.update(LogService.Log, log["_id"], {
        context,
        trace: data.trace,
        breadcrumbs: this.breadcrumbs,
        count: log.count + 1,
        updatedAt: currentDate,
      });
    }

    return await connection.insert(LogService.Log, {
      type: data.type,
      message: data.message,
      context,
      trace: data.trace,
      breadcrumbs: this.breadcrumbs,
      count: 1,
      createdAt: currentDate,
      updatedAt: currentDate,
    });
  }

  private getConnection(): EntityManager {
    return LogService.connection?.manager || this.memoryDbService;
  }

  private parseContext(context: ExecutionContextHost): Partial<Context> {
    const res: Partial<Context> = {};
    const args = context.getArgs();

    for (const arg of args) {
      if (arg.method) {
        res.method = arg.method;
      }

      if (arg.url) {
        res.url = arg.url;
      }

      if (arg.params) {
        res.params = arg.params;
      }

      if (arg.body) {
        res.body = arg.body;
      }

      if (arg.rawHeaders) {
        res.rawHeaders = {};
        const len = arg.rawHeaders.length - 1;

        for (let i = 0; i < len; i += 2) {
          res.rawHeaders[arg.rawHeaders[i]] = arg.rawHeaders[i + 1];
        }
      }
    }

    return res;
  }

  private async checkRecords() {
    if (LogService.options?.maxSize) {
      const latest = await this.getConnection().find(LogService.Log, {
        order: { updatedAt: "DESC" },
        take: LogService.options?.maxSize,
        select: ["_id"],
      });

      const latestIds = latest.map((item) => item.id);

      await LogService.connection
        .getRepository(LogService.Log)
        .createQueryBuilder()
        .delete()
        .from(LogService.Log)
        .where("_id NOT IN (:...ids)", { ids: latestIds })
        .execute();
    }
  }
}
