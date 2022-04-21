import { MobileCmd, MOBILE_QUEUE_PATTERN, QUEUE_DESTINATION, SUB_CMD } from '@nest-micro/constants';
import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { QueueUtil } from '@nest-micro/responder';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QUEUE_PATTERN } from '@nest-micro/constants';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly queue: QueueUtil,
    private readonly socket: WebsocketGateway,
  ) { }

  @Get()
  getData() {
    return this.appService.getData({ traceContext: 'listProducts' });
  }

  @Post('/users')
  async createUser(@Res() res: Response, @Body() data) {
    try {
      console.log(data);
      this.appService.setClient(data.req_id_uniq, res);
      data.cmdtype = MobileCmd.ECOM_MEMBER;
      data.sub_cmd = SUB_CMD.CREATE;
      data.traceContext = "createUser";
      return this.queue.send(QUEUE_DESTINATION.ECOM_MEMBER, data);
    } catch (err) {
      Logger.error(err);
    }
  }

  @MessagePattern(QUEUE_PATTERN.ECOM_RES)
  async handleConsumerServiceControl(@Payload() message) {
    // return this.appService.sendToApp(message);

    this.socket.sendToApp(message);
    return;
  }
}
