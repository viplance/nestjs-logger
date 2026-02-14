import {
  Injectable,
  LoggerService,
  OnApplicationShutdown,
} from '@nestjs/common';
import { MemoryDbService } from './memory-db.service';
import { defaultTable } from '../defaults';
import { Context, LogModuleOptions, LogType } from '../types';
import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntitySchema,
  Like,
  In,
} from 'typeorm';
import { createLogEntity } from '../entities/log.entity';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { setInterval } from 'timers';
import { entity2table } from '../utils/entity2table';
import { WsService } from './ws.service';
import { Subscription } from 'rxjs';

@Injectable()
export class LogService implements LoggerService, OnApplicationShutdown {
  static connection: DataSource;
  static options: LogModuleOptions;
  static Log: EntitySchema = createLogEntity(defaultTable, 'memory');
  static timer: ReturnType<typeof setInterval>;
  static subscription: Subscription;

  breadcrumbs: any[] = [];

  constructor(
    private readonly memoryDbService: MemoryDbService,
    private readonly wsService: WsService
  ) { }

  onApplicationShutdown() {
    if (LogService.timer) {
      clearInterval(LogService.timer);
    }
  }

  async connectDb(options: LogModuleOptions): Promise<DataSource> {
    LogService.Log = createLogEntity(
      options.database?.collection || options.database?.table || defaultTable,
      options.database?.type || 'mongodb'
    );

    if (!LogService.options) {
      this.setOptions(options);
    }

    const dataSourceOptions = {
      type: options.database?.type,
      database: options.database?.database,
      host: options.database?.host,
      port: options.database?.port,
      entities: [LogService.Log],
    } as DataSourceOptions;

    LogService.connection = new DataSource(dataSourceOptions);
    await LogService.connection.initialize();

    if (dataSourceOptions.type !== 'mongodb') {
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

    if (options.websocket && !LogService.subscription) {
      LogService.subscription = this.wsService.onMessage.subscribe(
        async (message) => {
          switch (message.action) {
            case 'getLogs':
              this.wsService.sendMessage({
                action: 'list',
                data: await this.getAll(
                  message.page,
                  message.limit,
                  message.search,
                  message.types
                ),
              });
              break;
            case 'delete':
              this.delete(message.data._id);
              break;
          }
        }
      );
    }
  }

  addBreadcrumb(breadcrumb: any) {
    this.breadcrumbs.push(breadcrumb);
  }

  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  log(message: string, context?: ExecutionContextHost | object) {
    this.smartInsert({
      type: LogType.LOG,
      message,
      context,
    });
  }

  error(
    message: string,
    trace?: string,
    context?: ExecutionContextHost | object
  ) {
    this.smartInsert({
      type: LogType.ERROR,
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: ExecutionContextHost | object) {
    this.smartInsert({
      type: LogType.WARN,
      message,
      context,
    });
  }

  debug(message: string, context?: ExecutionContextHost | object) {
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

  async getAll(
    page: number = 1,
    limit: number = 50,
    search: string = '',
    types: string[] = []
  ): Promise<any[]> {
    const skip = (page - 1) * limit;
    const take = limit;

    const findOptions: any = {
      select: [
        '_id',
        'type',
        'message',
        'count',
        'createdAt',
        'updatedAt',
        'context',
        'trace',
        'breadcrumbs',
      ],
      order: { updatedAt: 'DESC' },
      take,
      skip,
    };

    if (search) {
      if (LogService.options?.database?.type === 'mongodb') {
        const where: any = {
          $or: [
            { message: { $regex: search, $options: 'i' } },
            { trace: { $regex: search, $options: 'i' } },
          ],
        };

        if (types.length > 0) {
          where.type = { $in: types };
        }

        findOptions.where = where;
      } else {
        findOptions.where = [
          { message: Like(`%${search}%`) },
          { trace: Like(`%${search}%`) },
        ];

        if (types.length > 0) {
          findOptions.where.forEach((option: any) => {
            option.type = In(types);
          });
        }
      }
    } else if (types.length > 0) {
      if (LogService.options?.database?.type === 'mongodb') {
        findOptions.where = {
          type: { $in: types },
        };
      } else {
        findOptions.where = {
          type: In(types),
        };
      }
    }

    return this.getConnection().find(LogService.Log, findOptions);
  }

  async delete(_id: string) {
    this.wsService.sendMessage({
      action: 'delete',
      data: { _id },
    });
    return this.getConnection().delete(LogService.Log, _id);
  }

  private async smartInsert(data: {
    type: LogType;
    message: string;
    context?: ExecutionContextHost | object;
    trace?: any;
  }): Promise<any> {
    const currentDate = new Date();

    const connection = this.getConnection();

    // find the same log in DB
    let log;

    if (LogService.options && (LogService.options.join || LogService.options.join === undefined)) {
      log = await connection.findOne(LogService.Log, {
        where: {
          type: data.type,
          message: data.message,
        },
      });
    }

    const context =
      data.context instanceof ExecutionContextHost
        ? this.parseContext(data.context)
        : data.context;

    if (log) {
      const updatedLog = {
        context,
        trace: data.trace,
        breadcrumbs: this.breadcrumbs,
        count: log.count + 1,
        updatedAt: currentDate,
      };

      this.wsService.sendMessage({
        action: 'update',
        data: { ...log, ...updatedLog },
      });

      await connection.update(LogService.Log, log['_id'], {
        context,
        trace: data.trace,
        breadcrumbs: this.breadcrumbs,
        count: log.count + 1,
        updatedAt: currentDate,
      });

      return { ...log, ...updatedLog };
    }

    const insertedLog = {
      type: data.type,
      message: data.message,
      context,
      trace: data.trace,
      breadcrumbs: this.breadcrumbs,
      count: 1,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    const res = await connection.insert(LogService.Log, insertedLog);
    const _id = this.getNewObjectId(res);

    this.wsService.sendMessage({
      action: 'insert',
      data: { _id, ...insertedLog },
    });

    return { _id, ...insertedLog };
  }

  private getNewObjectId(result: any): string | number {
    if (result.identifiers) {
      return result.identifiers[0]._id;
    }

    console.log(result);

    return result._id;
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
        order: { updatedAt: 'DESC' },
        take: LogService.options?.maxSize,
        select: ['_id'],
      });

      const latestIds = latest.map((item) => item.id);

      await LogService.connection
        .getRepository(LogService.Log)
        .createQueryBuilder()
        .delete()
        .from(LogService.Log)
        .where('_id NOT IN (:...ids)', { ids: latestIds })
        .execute();
    }
  }
}
