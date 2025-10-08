import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from "@nestjs/common";
import { Inject, Injectable } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { LogService } from "./services/log.service";

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(@Inject(LogService) private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: (error) => {
          // error handler
          this.logService?.error(error.message, error.stack, context);
        },
        complete: () => {
          // normal request
        },
      })
    );
  }
}
