import { Module, Global, HttpException } from "@nestjs/common";
import { LogService } from "./services/log.service";
import { MemoryDbService } from "./services/memory-db.service";
import { LogInterceptor } from "./log.interceptor";
import { LogModuleOptions } from "./types";
import { TypeOrmModule } from "@nestjs/typeorm";
import querystring from "node:querystring";

@Global()
@Module({
  imports: [TypeOrmModule],
  providers: [LogService, MemoryDbService],
  exports: [TypeOrmModule, LogService, MemoryDbService],
})
export class LogModule {
  public static async connect(
    app: any,
    options?: LogModuleOptions
  ): Promise<void> {
    app.resolve(LogService);

    const logService: LogService = await app.resolve(LogService);

    app.useGlobalInterceptors(new LogInterceptor(logService)); // intercept all errors

    if (options?.path) {
      const httpAdapter = app.getHttpAdapter();
      httpAdapter.get(options.path, async (req: any, res: any) => {
        if (LogService.options?.key) {
          const params = querystring.parse(req.url.split("?")[1]);

          if (params.key && params.key !== LogService.options.key) {
            throw new HttpException("Unauthorized", 401);
          }
        }

        res.json(await logService.getAll());
      });
    }

    if (options) {
      await logService.connectDb(options);
    }
  }
}
