import { Module, DynamicModule, Global } from "@nestjs/common";
import { CustomLoggerService } from "./logger.service";

export interface LoggerModuleOptions {
  prefix?: string;
}

@Global()
@Module({})
export class CustomLoggerModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    return {
      module: CustomLoggerModule,
      providers: [
        {
          provide: CustomLoggerService,
          useFactory: () => {
            return new (class extends CustomLoggerService {
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
            })();
          },
        },
      ],
      exports: [CustomLoggerService],
    };
  }
}
