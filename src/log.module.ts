import { Module, DynamicModule, Global } from "@nestjs/common";
import { LogService } from "./log.service";
import { LogDbService } from "./db.service";

export interface LogModuleOptions {
  prefix?: string;
}

@Global()
@Module({})
export class LogModule {
  static forRoot(options: LogModuleOptions = {}): DynamicModule {
    return {
      module: LogModule,
      providers: [
        {
          provide: LogService,
          useFactory: (logDbService: LogDbService) => {
            return new (class extends LogService {
              constructor(logDbService: LogDbService) {
                super(logDbService);
              }
              override log(message: string, context?: string) {
                super.log(`${options.prefix ?? ""}${message}`, context);
              }
              override error(
                message: string,
                trace?: string,
                context?: string
              ) {
                super.error(
                  `${options.prefix ?? ""}${message}`,
                  trace,
                  context
                );
              }
              override warn(message: string, context?: string) {
                super.warn(`${options.prefix ?? ""}${message}`, context);
              }
            })(logDbService);
          },
        },
        LogDbService,
      ],
      exports: [LogService],
    };
  }
}
