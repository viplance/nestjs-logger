import {
  ExecutionContext,
  Injectable,
  LoggerService,
  Scope,
} from "@nestjs/common";
import { LogDbService } from "./db.service";
@Injectable({ scope: Scope.TRANSIENT })
export class LogService implements LoggerService {
  constructor(private readonly logDbService: LogDbService) {}

  log(message: string, context?: string) {
    console.log(`[LOG]${context ? " [" + context + "]" : ""}: ${message}`);
  }

  error(message: string, trace?: string, context?: ExecutionContext) {
    console.error(`[ERROR]${context ? " [" + context + "]" : ""}: ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    console.warn(`[WARN]${context ? " [" + context + "]" : ""}: ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[DEBUG]${context ? " [" + context + "]" : ""}: ${message}`);
  }

  verbose(message: string, context?: string) {
    console.info(`[VERBOSE]${context ? " [" + context + "]" : ""}: ${message}`);
  }
}
