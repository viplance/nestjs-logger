## @viplance/nestjs-logger
# NestJS internal logging system

1. Install the package npm i @viplance/nestjs-logger
2. Import the module in app.module.ts
    import { LogModule } from '@viplance/nestjs-logger';

    @Module({
        imports: [
            ...,
            LogModule,
        ]
    })
3. Use the LogService in case of custom logs.
3. If you want to catch all errors automatically, put the code in main.ts
    import { LogInterceptor, LogService } from '@viplance/nestjs-logger';

    const logService = await app.resolve(LogService);
    app.useGlobalInterceptors(new LogInterceptor(logService));

Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()
