## @viplance/nestjs-logger
# NestJS internal logging system

1. Install the package npm i @viplance/nestjs-logger<br />
2. Import the module in app.module.ts<br />
    import { LogModule } from '@viplance/nestjs-logger';<br />
    @Module({<br />
        imports: [<br />
            ...,<br />
            LogModule,<br />
        ]<br />
    })<br />
<br />
3. Connect the module in main.ts
    // use the memory to store logs
    await LogModule.connect(app, {<br />
        path: '/logs',<br />
    });<br /><br />
    // use the database to store logs
    await LogModule.connect(app, {<br />
        path: '/logs',<br />
        database: {<br />
            type: 'mongodb',<br />
            host: 'localhost',<br />
            port: 27017,<br />
            collection: 'logs'<br />
        }<br />
    });<br />

    * `path` and `database` options are optional<br />
4. Use the LogService in case of custom logs to debug the application.
<br />
The logs could be available at your_application_url/<path><br />
By default the logs will be stored in memory and deleted when the application stops.<br />
<br />
Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()
