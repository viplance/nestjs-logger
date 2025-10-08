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
    import { LogModule } from '@viplance/nestjs-logger';

    await LogModule.connect(app, {
        path: '/logs',
        database: {
            type: 'mongodb',
            host: 'localhost',
            port: 27017,
            collection: 'logs'
        }
    });

`path` and `database` options are optional
The logs could be available at your_application_url/<path>
By default the logs will be stored in memory and deleted when the application stops.

Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()
