import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';


import { Message } from '../interfaces';
import { ErrCode, MobileCmd } from '@nest-micro/constants';

@Injectable()
export class MessageValidationPipe implements PipeTransform {
  transform(value: Message, metadata: ArgumentMetadata) {
    if (!value.cmdtype || !Object.values(MobileCmd).includes(value.cmdtype)) {
      throw new WsException(ErrCode.BAD_REQUEST);
    }
    return value;
  }
}
