import { Injectable } from '@nestjs/common';
import { QueueUtil } from '@nest-micro/responder';
import { SUB_CMD } from '@nest-micro/constants';
import { UsersRepository } from './repositories';
import { ResponseUtil } from 'libs/responder/src/lib/utils';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AppService {

  constructor(
    private readonly queue: QueueUtil,
    protected readonly userRepository: UsersRepository,
    private readonly responseUtil: ResponseUtil
  ) { }

  getData(): { message: string } {
    return { message: 'Welcome to member!' };
  }

  async memberProcess(message, metadata?: any) {
    const { cmdtype, sub_cmd: subCmd } = message;
    switch (subCmd) {
      case SUB_CMD.CREATE : {
        const userDto = message;
        return await this.createUser(userDto, metadata);
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

  async createUser(userDto, metadata?: any) {
    let user = await this.userRepository.createUser(userDto);
    user = new UserEntity(user);
    return this.queue.sendToGateWay(userDto, user);
  }

  helloProcess(payload, metadata?: any) {
    const data = {
      foo: 'this is message to welcome u',
      bar: 'https://via.placeholder.com/250'
    }
    payload.ctx = 'xyz';
    this.responseUtil.success({ ...payload, ...data });
  }

}
