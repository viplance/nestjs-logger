import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { LogService } from '../services/log.service';
import querystring from 'node:querystring';

@Injectable()
export class LogAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = !!context.switchToHttp
      ? context.switchToHttp().getRequest()
      : context; // hook for using as method

    const params = querystring.parse(req.url.split('?')[1]);

    if (LogService.options.key && params.key !== LogService.options.key) {
      throw new HttpException('Unauthorized', 401);
    }

    return true;
  }
}
