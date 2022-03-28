import { Controller, Get, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AppService } from './app.service';
import {
  QUEUE_PATTERN,
} from '@nest-micro/constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern(QUEUE_PATTERN.LOYALTY_MEMBER)
  handleMember(@Payload() message) {
    Logger.log(message, `handleMember`);
    return this.appService.testHandle(message);
  }
}
