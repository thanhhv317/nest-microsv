import { QUEUE_DESTINATION } from '@nest-micro/constants';
import { Body, Controller, Get, Post } from '@nestjs/common';
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
  login(@Body() data) {
    try {
      console.log(data);
      this.queue.send(QUEUE_DESTINATION.LOYALTY_MEMBER, data);
    } catch (err) {
      console.log(err);
    }

  }

  // receipt data
  @MessagePattern(QUEUE_PATTERN.LOYALTY_RES)
  handleConsumerServiceControl(@Payload() message) {
   return message;
  }
}
