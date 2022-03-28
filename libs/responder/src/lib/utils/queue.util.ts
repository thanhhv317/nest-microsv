import { ActiveMQPubSubClient } from '@nest-micro/activemq';
import {
  QUEUE_DESTINATION,
  RESPONSE_MESSAGE,
  RESPONSE_STATUS,
} from '@nest-micro/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PROVIDER } from '../constants';

@Injectable()
export class QueueUtil {
  private _queue;

  constructor(
    @Inject(PROVIDER.RESPONDER) private readonly responderConfig,
  ) {
    this.handleStart();
  }

  async send(queue: string, data: any) {
    try {
      await this._queue
        .send(queue, data)
        .subscribe(() => Logger.log(queue, 'QueueUtil send'));
    } catch (err) {
      Logger.error(err, '', 'QueueUtil send');
    }
  }

  async sendToGateWay(
    data,
    response_data?: any,
    message?: string,
    status?: number
  ) {
    try {
      data.status = RESPONSE_STATUS.SUCCESS;
      data.message = RESPONSE_MESSAGE.SUCCESS;

      if (response_data) data.response_data = response_data;
      if (message) data.message = message;
      if (!isNaN(status)) data.status = status;

      const cmdQueue = QUEUE_DESTINATION.LOYALTY_RES;
      this._queue
        .send(cmdQueue, data)
        .subscribe(() => Logger.log(cmdQueue, 'QueueUtil sendToGateWay'));
    } catch (err) {
      Logger.error(err, '', 'QueueUtil sendToGateWay');
    }
  }

  async sendFailedToGateWay(data, message?: string, response_data?: any) {
    try {
      data.status = RESPONSE_STATUS.FAILED;
      data.message = message || RESPONSE_MESSAGE.FAILED;

      if (response_data) data.response_data = response_data;

      const cmdQueue = QUEUE_DESTINATION.LOYALTY_RES;
      this._queue
        .send(cmdQueue, data)
        .subscribe(() =>
          Logger.log(cmdQueue, 'QueueUtil sendFailedToGateWay')
        );
    } catch (err) {
      Logger.error(err, '', 'QueueUtil sendFailedToGateWay');
    }
  }

  private handleStart() {
    try {
      Logger.log('handleStart', 'QueueUtil');
      this._queue = new ActiveMQPubSubClient(this.responderConfig);
    } catch (err) {
      Logger.error(err, '', 'QueueUtil handleStart');
    }
  }
}
