## @viplance/nestjs-logger
# NestJS internal logging system

1. Install the package npm i @viplance/nestjs-logger
2. Import the module in app.module.ts
    import { LogModule } from '@viplance/nestjs-logger';
    CustomLoggerModule.forRoot({ prefix: '[MyApp] ' }), // prefix is an optional parameter
3. Use the LogService in case of custom logs.
3. If you want to catch all errors automatically, put the code in main.ts
    import { ErrorInterceptor } from 'src/interceptors/error.interceptor';
    import { LogService } from '@viplance/nestjs-logger';

    const logService = app.get(LogService);
    app.useGlobalInterceptors(
        new ErrorInterceptor(logService),
    );

    error.interceptor.ts
    import type {
        CallHandler,
        ExecutionContext,
        NestInterceptor,
    } from '@nestjs/common';
    import { Inject, Injectable } from '@nestjs/common';
    import { LogService } from '@viplance/nestjs-logger';
    import { Observable, tap } from 'rxjs';

    @Injectable()
    export class ErrorInterceptor implements NestInterceptor {
        constructor(
            @Inject(LogService) private logger: LogService,
        ) {
            this.logger.log('Application started');
        }

        intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
            return next.handle().pipe(
            tap({
                error: (error) => {
                    this.logger.error('Error');
                },
                complete: () => {
                    this.logger.log('Normal request');
                },
            }),
            );
        }
    }

Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()

