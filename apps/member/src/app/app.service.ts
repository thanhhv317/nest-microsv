import { Injectable } from '@nestjs/common';
import { QueueUtil } from '@nest-micro/responder';
import { SUB_CMD } from '@nest-micro/constants';
import { UsersRepository } from './repositories';

@Injectable()
export class AppService {

  constructor(
    private readonly queue: QueueUtil,
    protected readonly userRepository: UsersRepository
  ) { }

  getData(): { message: string } {
    return { message: 'Welcome to member!' };
  }

  async memberProcess(message) {
    const { cmdtype, sub_cmd: subCmd } = message;
    switch (subCmd) {
      case SUB_CMD.CREATE : {
        const userDto = message;
        this.createUser(userDto);
        break;
      }
      default: 
        return this.queue.sendToGateWay(message, {});
    }
  }

  testHandle(message) {
    // get listUser
    return this.queue.sendToGateWay(message, {});
  }

  async createUser(userDto) {
    console.log("==========")
    const user = await this.userRepository.createUser(userDto);
    console.log("========== AAAAAAAA")
    
    
    return this.queue.sendToGateWay(userDto, user);
  }
}
