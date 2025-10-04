import { Module, Global } from "@nestjs/common";
import { LogService } from "./services/log.service";
import { LogDbService } from "./services/db.service";
import { LogInterceptor } from "./log.interceptor";

@Global()
@Module({
  providers: [LogService, LogDbService],
  exports: [LogService, LogDbService],
})
export class LogModule {
  public static async connect(app: any, url?: string): Promise<void> {
    app.resolve(LogService);
    const logService: LogService = await app.resolve(LogService);
    app.useGlobalInterceptors(new LogInterceptor(logService)); // intercept all errors

    if (url) {
      const httpAdapter = app.getHttpAdapter();
      httpAdapter.get(url, async (req: any, res: any) => {
        res.json(logService.getAll());
      });
    }
  }
}
