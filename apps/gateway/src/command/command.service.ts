import { COMMAND_QUEUE } from '@nest-micro/constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandService {

  getCommandQueue(wsRequest) {
    if (!wsRequest) return null;

    return  COMMAND_QUEUE[wsRequest.cmdtype]
  }
}
