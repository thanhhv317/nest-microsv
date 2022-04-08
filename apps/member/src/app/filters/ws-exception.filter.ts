import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ResponseUtil } from 'libs/responder/src/lib/utils';

import { IErrCode } from '../interfaces';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  constructor(private responseUtil: ResponseUtil) {}

  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const error = exception.getError() as IErrCode;
    return this.responseUtil.failed(client, error);
  }
}
