import { Controller, Get, Logger, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AppService } from './app.service';
import {
  ErrCode,
  MobileCmd,
  MOBILE_QUEUE_PATTERN,
  QUEUE_PATTERN,
} from '@nest-micro/constants';
import { WsExceptionFilter } from './filters';
import { MessageBody } from '@nestjs/websockets';
import { ResponseUtil } from 'libs/responder/src/lib/utils';

@UseFilters(WsExceptionFilter)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responseUtil: ResponseUtil
    ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // queue for rest-api
  @MessagePattern(QUEUE_PATTERN.ECOM_MEMBER)
  handleMember(@Payload() message) {
    Logger.log(message, `handleMember`);
    return this.appService.memberProcess(message, { traceContext: 'handleMember' });
  }

  // queue for websocket
  @MessagePattern(QUEUE_PATTERN.HELLO)
  handleSocketMember(@MessageBody() payload: any) {
    Logger.log(payload, `handleHello`);
    switch(payload.cmdtype) {
      case MobileCmd.HELLO: {
        this.appService.helloProcess(payload, { traceContext: 'handleMember' });
        break;
      }

      default: {
        this.responseUtil.failed(payload, ErrCode.DEFAULT);
      }
    }
  }
}
