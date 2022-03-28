import { QUEUE_DESTINATION } from '@nest-micro/constants';
import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { QueueUtil } from '@nest-micro/responder';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QUEUE_PATTERN } from '@nest-micro/constants';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly queue: QueueUtil) { }

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('/login')
  login(@Res() res: Response,@Body() data) {
    try {
      this.appService.setClient(data.req_id_uniq, res);
      return this.queue.send(QUEUE_DESTINATION.LOYALTY_MEMBER, data);
    } catch (err) {
      Logger.error(err);
    }
  }

  @MessagePattern(QUEUE_PATTERN.LOYALTY_RES)
  handleConsumerServiceControl(@Payload() message) {
    return this.appService.sendToApp(message);
  }
}
