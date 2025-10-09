# @viplance/nestjs-logger
## NestJS internal logging system

[![npm version](https://img.shields.io/npm/v/@viplance/nestjs-logger.svg?style=flat-square)](https://www.npmjs.com/package/@viplance/nestjs-logger)
[![GitHub stars](https://img.shields.io/github/stars/viplance/nestjs-logger.svg?style=social)](https://github.com/viplance/nestjs-logger)

### Installation
1. Install the package npm i @viplance/nestjs-logger<br />
2. Import the module in app.module.ts<br />
```
    import { LogModule } from '@viplance/nestjs-logger';<br />
    @Module({
        imports: [
            ...,
            LogModule,
        ]
    })
```
<br />
3. Connect the module in main.ts
```
    // use the memory to store logs
    await LogModule.connect(app, {
        path: '/logs', // define the public URL for the log list
        key: 'kjhj#$kj3lqq1', // use the key to protect data from unauthorized access
    });
    // use the database to store logs
    await LogModule.connect(app, {
        path: '/logs',
        database: {
            type: 'mongodb',
            host: 'localhost',
            port: 27017,
            collection: 'logs',
        }
    });
```
<br />

### Additional information

`path` and `database` options are optional
<br />
Use the LogService in case of custom logs to debug the application.
<br />
The logs could be available at your_application_url/<path>?key=<key><br />
By default the logs will be stored in memory and deleted when the application stops.<br />
<br />
Available service methods:
- log()
- error()
- warn()
- debug()
- verbose()
