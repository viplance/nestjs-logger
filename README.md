## @viplance/nestjs-logger
# NestJS internal logging system

1. Install the package npm i @viplance/nestjs-logger<br />
2. Import the module in app.module.ts<br />
    &ensp;import { LogModule } from '@viplance/nestjs-logger';<br />
<br />
    &ensp;@Module({<br />
        &ensp;&ensp;imports: [<br />
            &ensp;&ensp;&ensp;...,<br />
            &ensp;&ensp;&ensp;LogModule,<br />
        &ensp;&ensp;]<br />
    &ensp;})<br />
    &ensp;import { LogModule } from '@viplance/nestjs-logger';<br />
<br />
    &ensp;// use the memory to store logs
    &ensp;await LogModule.connect(app, {<br />
        &ensp;&ensp;path: '/logs',<br />
    &ensp;&ensp;});<br /><br />
    &ensp;// use the database to store logs
    &ensp;await LogModule.connect(app, {<br />
        &ensp;&ensp;path: '/logs',<br />
        &ensp;&ensp;&ensp;database: {<br />
            &ensp;&ensp;&ensp;&ensp;type: 'mongodb',<br />
            &ensp;&ensp;&ensp;&ensp;host: 'localhost',<br />
            &ensp;&ensp;&ensp;&ensp;port: 27017,<br />
            &ensp;&ensp;&ensp;&ensp;collection: 'logs'<br />
        &ensp;&ensp;&ensp;}<br />
    &ensp;&ensp;});<br />
3. Use the LogService in case of custom logs to debug the application.
<br />
<br />
`path` and `database` options are optional<br />
The logs could be available at your_application_url/<path><br />
By default the logs will be stored in memory and deleted when the application stops.<br />
<br />
Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()
