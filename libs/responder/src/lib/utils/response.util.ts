import { ErrCode, ErrorMessage, State } from '@nest-micro/constants';
import { Injectable, Logger } from '@nestjs/common';
import { IErrCode } from '../interfaces';
import { QueueUtil } from './queue.util';

@Injectable()
export class ResponseUtil {
  constructor(
    private readonly queueUtil: QueueUtil,
  ) {}

  success(request: any) {
    try {
      const result = {
        ...request,
        state: State.COMPLETED, // COMPLETE
        result: ErrCode.SUCCESS.code,
        message: ErrCode.SUCCESS.message
      };
      // Logger.debug(
      //   JSON.stringify(result),
      //   `req_id: ${request.req_id} RESPONSE`
      // );
      return this.queueUtil.sendToGateWay(result);
    } catch (err) {
      Logger.error(err, '', 'ResponseUtil success');
    }
  }

  failed(request: any, error?: IErrCode) {
    try {
      const result = {
        ...request,
        state: State.FAILED, // FAILED
        result: error.code,
        message: error.message
      };
      Logger.debug(
        JSON.stringify(result),
        `req_id: ${result.req_id} RESPONSE`
      );
      return this.queueUtil.sendToGateWay(result);
    } catch (err) {
      Logger.error(err, '', 'ResponseUtil failed');
    }
  }

  failedEspecially(request: any, error: number) {
    try {
      const result = {
        ...request,
        state: State.FAILED, // FAILED
        result: error,
        message: ErrorMessage[error] || ErrCode.DEFAULT.message
      };
      Logger.debug(
        JSON.stringify(result),
        `req_id: ${result.req_id} RESPONSE`
      );
      return this.queueUtil.sendToGateWay(result);
    } catch (err) {
      Logger.error(err, '', 'ResponseUtil failedEspecially');
    }
  }
  sendError(request: any, error: any) {
    try {
      const result = {
        ...request,
        state: error.state,
        result: error.code,
        message: error.message
      };
      return this.queueUtil.sendToGateWay(result);
    } catch (error) {
      Logger.error(error);
    }
  }

  checkCoreRes(request) {
    if (
      request.state != State.PROCESSING &&
      request.result !== ErrCode.SUCCESSFUL.code
    ) {
      return Promise.reject(request.result);
    } else {
      return Promise.resolve();
    }
  }
}
