import { Module, Global, HttpException } from '@nestjs/common';
import { LogService } from './services/log.service';
import { MemoryDbService } from './services/memory-db.service';
import { LogInterceptor } from './interceptors/log.interceptor';
import { LogModuleOptions } from './types';
import { TypeOrmModule } from '@nestjs/typeorm';
import querystring from 'node:querystring';
import { ApplicationConfig } from '@nestjs/core';
import { join } from 'node:path';
import { LogAccessGuard } from './guards/access.guard';
import { WsService } from './services/ws.service';

@Global()
@Module({
  imports: [TypeOrmModule],
  providers: [
    ApplicationConfig,
    LogAccessGuard,
    LogService,
    MemoryDbService,
    WsService,
  ],
  exports: [TypeOrmModule, LogService, MemoryDbService, WsService],
})
export class LogModule {
  public static async init(
    app: any,
    options?: LogModuleOptions
  ): Promise<void> {
    const logService: LogService = await app.get(LogService);
    const wsService: WsService = await app.get(WsService);
    const logAccessGuard: LogAccessGuard = await app.get(LogAccessGuard);

    if (options) {
      logService.setOptions(options);
    }

    app.useGlobalInterceptors(new LogInterceptor(logService)); // intercept all errors

    if (options?.path) {
      app.useStaticAssets(join(__dirname, '..', 'public'), {
        prefix: options.path,
      });

      const httpAdapter = app.getHttpAdapter();

      // frontend settings endpoint
      httpAdapter.get(
        join(options.path, 'settings'),
        async (req: any, res: any) => {
          logAccessGuard.canActivate(req);

          const result: { [key: string]: any } = {};

          if (options?.websocket) {
            result.websocket = {
              namespace: options.websocket?.namespace,
              port: options.websocket?.port,
              host: options.websocket?.host || req.headers?.host.split(':')[0],
            };
          }

          res.json(result);
        }
      );

      // get all logs endpoint
      httpAdapter.get(join(options.path, 'api'), async (req: any, res: any) => {
        logAccessGuard.canActivate(req);

        res.json(await logService.getAll());
      });

      // delete log endpoint
      httpAdapter.delete(
        join(options.path, 'api'),
        async (req: any, res: any) => {
          logAccessGuard.canActivate(req);

          const params = querystring.parse(req.url.split('?')[1]);

          if (!params.id) {
            throw new HttpException('id is required', 400);
          }

          res.json(await logService.delete(params.id.toString()));
        }
      );

      // set up WebSocket connection
      if (options?.websocket) {
        wsService.setupConnection(options.websocket, options.key);
      }
    }

    if (options?.database) {
      await logService.connectDb(options);
    }
  }
}
