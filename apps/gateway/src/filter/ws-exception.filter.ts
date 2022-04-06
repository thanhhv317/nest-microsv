import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const ws = host.switchToWs();
    const client = ws.getClient();
    const data = ws.getData();
    const error = exception.getError();
    const response = {
      ...data,
      result: error['code'],
      message: error['message'],
    };
    client.send(JSON.stringify(response));
  }
}
