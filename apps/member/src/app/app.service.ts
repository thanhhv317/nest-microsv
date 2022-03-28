import { Injectable } from '@nestjs/common';
import { QueueUtil } from '@nest-micro/responder';

@Injectable()
export class AppService {

  constructor(
    private readonly queue: QueueUtil
  ) { }

  getData(): { message: string } {
    return { message: 'Welcome to member!' };
  }


  testHandle(message) {
    return this.queue.sendToGateWay(message, {});
  }
}