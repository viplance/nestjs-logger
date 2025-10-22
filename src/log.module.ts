import { Module, Global, HttpException } from "@nestjs/common";
import { LogService } from "./services/log.service";
import { MemoryDbService } from "./services/memory-db.service";
import { LogInterceptor } from "./interceptors/log.interceptor";
import { LogModuleOptions } from "./types";
import { TypeOrmModule } from "@nestjs/typeorm";
import querystring from "node:querystring";
import { ApplicationConfig } from "@nestjs/core";
import { join } from "node:path";
import { LogAccessGuard } from "./guards/access.guard";

@Global()
@Module({
  imports: [TypeOrmModule],
  providers: [ApplicationConfig, LogAccessGuard, LogService, MemoryDbService],
  exports: [TypeOrmModule, LogService, MemoryDbService],
})
export class LogModule {
  public static async init(
    app: any,
    options?: LogModuleOptions
  ): Promise<void> {
    app.resolve(LogService);

    const logService: LogService = await app.resolve(LogService);
    const logAccessGuard: LogAccessGuard = await app.get(LogAccessGuard);

    if (options) {
      logService.setOptions(options);
    }

    app.useGlobalInterceptors(new LogInterceptor(logService)); // intercept all errors

    if (options?.path) {
      app.useStaticAssets(join(__dirname, "..", "public"), {
        prefix: options.path,
      });

      const httpAdapter = app.getHttpAdapter();

      // get all logs endpoint
      httpAdapter.get(join(options.path, "api"), async (req: any, res: any) => {
        logAccessGuard.canActivate(req);

        res.json(await logService.getAll());
      });

      // delete log endpoint
      httpAdapter.delete(
        join(options.path, "api"),
        async (req: any, res: any) => {
          logAccessGuard.canActivate(req);

          const params = querystring.parse(req.url.split("?")[1]);

          if (!params.id) {
            throw new HttpException("id is required", 400);
          }

          res.json(await logService.delete(params.id.toString()));
        }
      );
    }

    if (options?.database) {
      await logService.connectDb(options);
    }
  }
}
