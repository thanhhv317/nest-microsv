import { CMD_TYPE, QUEUE_DESTINATION, SUB_CMD } from '@nest-micro/constants';
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

  @Post('/users')
  createUser(@Res() res: Response, @Body() data) {
    try {
      console.log(data);
      this.appService.setClient(data.req_id_uniq, res);
      data.cmdtype = CMD_TYPE.ECOM_MEMBER;
      data.sub_cmd = SUB_CMD.CREATE;
      return this.queue.send(QUEUE_DESTINATION.ECOM_MEMBER, data);
    } catch (err) {
      Logger.error(err);
    }
  }

  // @Get('/users')
  // listUsers(@Res() res: Response, @Query() query: any) {
  //   try {
  //     console.log(query);
  //     this.appService.setClient(data.req_id_uniq, res);
  //     return this.queue.send(QUEUE_DESTINATION.ECOM_MEMBER, data);
  //   } catch (err) {
  //     Logger.error(err);
  //   }
  // }

  @MessagePattern(QUEUE_PATTERN.ECOM_RES)
  handleConsumerServiceControl(@Payload() message) {
    return this.appService.sendToApp(message);
  }
}
