import {
  ExecutionContext,
  Injectable,
  LoggerService,
  Scope,
} from "@nestjs/common";
import { LogDbService } from "./db.service";
import { defaultTable } from "../defaults";
import { LogType } from "../types";

@Injectable({ scope: Scope.TRANSIENT })
export class LogService implements LoggerService {
  constructor(private readonly dbService: LogDbService) {}

  log(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.LOG,
      message,
      context,
    });
  }

  error(message: string, trace?: string, context?: ExecutionContext) {
    this.smartInsert(defaultTable, {
      type: LogType.ERROR,
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.WARN,
      message,
      context,
    });
  }

  debug(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.DEBUG,
      message,
      context,
    });
  }

  verbose(message: string, context?: string) {
    this.smartInsert(defaultTable, {
      type: LogType.VERBOSE,
      message,
      context,
    });
  }

  getAll(): any[] {
    return this.dbService.getMany(defaultTable);
  }

  private smartInsert(table: string, data: any): string {
    return this.dbService.insert(table, data);
  }
}
