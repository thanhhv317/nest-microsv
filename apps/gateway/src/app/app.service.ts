import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  clients = new Map();

  getData(metadata?:any): { message: string } {
    console.log(metadata);
    return { message: 'Welcome to gateway!' };
  }

  getClient(reqId: number) {
    return this.clients.get(reqId);
  }

  setClient(reqId: number, res: Response) {
    return this.clients.set(reqId, res);
  }

  generateReqId() {
    return Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // send to app - not use with websocket
  async sendToApp(data, metadata?: any) {
    try {
      const client = await this.getClient(data && data.req_id_uniq);
      if (!client) {
        Logger.log(
          `${data && data.req_id_uniq} ${data && data.req_from}`,
          `NO CLIENT`
        );
        return;
      }

      // const responseData = this.formatResponse(data);
      const responseData = await this.formatResponse(data, metadata);

      Logger.log(responseData, `GATEWAY sendToApp`);

      return client.send(responseData);
    } catch (err) {
      Logger.debug(err, `GATEWAY sendToApp`);
    }
  }

  async formatResponse(data, metadata?: any) {
    try {
      delete data.req_id_uniq;
      delete data.req_from;
      delete data.command_action;

      const responseData: any = {
        status: data.status,
        message: data.message,
        response_data: null
      };

      if (data.response_data) responseData.response_data = data.response_data;
      return responseData;
    } catch (err) {
      Logger.error(data, '', 'GATEWAY APP_SERVICE FORMAT_RESPONSE');
    }
  }

}
