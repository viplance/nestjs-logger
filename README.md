# @viplance/nestjs-logger
## NestJS internal logging system

[![npm version](https://img.shields.io/npm/v/@viplance/nestjs-logger.svg?style=flat-square)](https://www.npmjs.com/package/@viplance/nestjs-logger)
[![GitHub stars](https://img.shields.io/github/stars/viplance/nestjs-logger.svg?style=social)](https://github.com/viplance/nestjs-logger)

### Installation
1. Install the package `npm i @viplance/nestjs-logger`<br />
2. Import the module in app.module.ts<br />
```typescript
    import { LogModule } from '@viplance/nestjs-logger';

    @Module({
        imports: [
            ...,
            LogModule,
        ]
    })
```

3. Init the module (typically in main.ts)<br />

```typescript
    import { LogModule } from '@viplance/nestjs-logger';

    await LogModule.init(app, {
        path: '/logs', // define the public URL for the log list
        key: 'kjhjmi321lqq7a', // use the key to protect data from unauthorized access
    });
```

Connect the database to store logs.<br />
```typescript
    await LogModule.init(app, {
        ...,
        database: {
            type: 'mongodb',
            host: 'localhost',
            port: 27017,
            collection: 'logs',
        }
    });
```

4. Use the `LogService` in case of custom logs to debug the application.<br />
```typescript
    import { LogService } from '@viplance/nestjs-logger';

    constructor(private logService: LogService) {}

    this.logService.log('Some log information');
```
<br />

### Additional information

- `path`, `key` and `database` properties are optional.
- The logs could be available at `your_application_url`/`path`?key=`key`
- The log API could be available at `your_application_url`/`path`/api?key=`key`
- By default the logs will be stored in memory and deleted when the application stops.<br />
<br />

### The LogService methods:
- log(message: string)
- error(message: string)
- warn(message: string)
- debug(message: string)
- verbose(message: string)
- addBreadcrumb(any)
