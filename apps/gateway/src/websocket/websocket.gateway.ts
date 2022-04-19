import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { CommandService } from '../command/command.service';
import { MessageValidationPipe } from '../pipes';
import type { Message } from '../interfaces';
import { WsExceptionFilter } from '../filter';
import { environment } from '../environments/environment';
import { ErrCode, MOBILE_QUEUE_BASE_PATTERN, osHostname, State } from '@nest-micro/constants';
import { ActiveMQPubSubClient } from '@nest-micro/activemq';
import { Tracer } from '@nest-micro/tracer';

@WebSocketGateway(+environment.socket_port, {
  transports: ['websocket', 'polling']
})
export class WebsocketGateway {
  private clients = {};
  private mapClients = {};
  private queue;
  private wsIdleTime = 5 * 60 * 1000;
  private wsCleanTime = 2 * 60 * 1000;
  private cleanWsInterval;

  @WebSocketServer()
  private wss;

  constructor(
    private readonly commandService: CommandService,
    // private readonly tracer: Tracer
  ) {}

  afterInit(wss) {
    !wss || !wss.options || !wss.options.port
      ? Logger.error('failed', 'WS Started')
      : Logger.log(wss.options.port, 'WS Started on port');

    this.handleStart();
    // this.cleanSocket();
  }

  async handleConnection(socket: any, message: any) {
    try {
      const clientID = JSON.parse(
        JSON.stringify(message.headers['sec-websocket-key'])
      );
      const clientIP = socket._socket.remoteAddress;
      socket.client_id = clientID;
      socket.client_ip = clientIP;
      socket.start_at = Date.now();
      socket.is_alive = true;
      this.clients[clientID] = socket;
      // this.ping(socket);
      // socket.on('pong', this.pong.bind(this, socket));
      Logger.log(
        `Client: ${clientID} IP: ${clientIP}`,
        'WS New Connection'
      );
    } catch (err) {
      Logger.error(err, '', 'WS Connect New Connect Error');
    }
  }

  async handleDisconnect(socket: any) {
    try {
      const clientID = socket.client_id;
      Logger.debug(clientID, 'WS Disconnect');
      const clientSocket = this.clients[clientID];
      if (clientSocket) {
        Logger.log(
          `${clientSocket.initiator}: ${clientID}`,
          'WS Disconnect Info'
        );

        this.mapClients[clientSocket.initiator] &&
          delete this.mapClients[clientSocket.initiator];
        delete this.clients[clientID];
      }
      Logger.log(
        Object.keys(this.clients).length.toString(),
        'WS Online'
      );
    } catch (err) {
      Logger.error(err, '', 'WS Disconnect Error');
    }
  }

  @UseFilters(WsExceptionFilter)
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: any,
    @MessageBody(MessageValidationPipe) payload: Message
  ) {
    // this.tracer.SpanStart('test', '3123');
    // this.tracer.LogInput({...payload});

    // this.tracer.SpanFinish();
    payload.req_id = this.generateReqId();
    Logger.log(`${payload.req_id} ${socket.client_id}`, 'WS Req ID from');
    this.processData(socket, payload);
    return { req_id: payload.req_id, cmdtype: payload.cmdtype };
  }

  processData(socket, data) {
    try {
      // Temp fix use password
      if (data.password) {
        data.pin = data.password;
      }

      const clientID = socket.client_id;
      const cmdQueue = this.commandService.getCommandQueue(data);
      Logger.debug(cmdQueue, 'WS Command Queue');
      data['client_socket_id'] = clientID;
      data['client_host_name'] = osHostname;

      if (cmdQueue) {
        this.queue
          .send(cmdQueue, data)
          .subscribe(() => Logger.log(cmdQueue, 'WS Send Queue'));
        Logger.log(data);
      }
    } catch (err) {
      Logger.error(err, '', 'WS processData');
    }
  }

  generateReqId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  handleStart() {
    Logger.log('handleStart', 'WS Gateway');
    this.queue = new ActiveMQPubSubClient(environment);
  }

  sendToApp(data) {
    try {
      const socket = this.getSocket(data);
      if (!socket) {
        Logger.log(
          `${data && data.req_id} ${data && data.client_socket_id} ${
            data && data.reqid
          } ${data && data.initiator} ${data && data.cmdtype}`,
          'NO SOCKET'
        );
        Logger.log(`${Object.keys(this.clients)}`, `WS CLIENTS`);
        return;
      }

      if (data.noti && !data.handler && !data.reqid) {
        Logger.warn(data, 'WS SendToApp No Handler');
        return;
      }

      delete data.client_socket_id;
      delete data.client_host_name;

      const dataStringify: any = JSON.stringify(data);
      socket.send(dataStringify);
      if (data.cmdtype === 324)
        return Logger.log('shoppage', 'sendToApp');
      Logger.log(dataStringify);
    } catch (err) {
      Logger.debug(err, 'WS sendToApp');
    }
  }

  getSocket(data) {
    try {
      if (!data) return null;

      if (
        !this.isPhoneNumber(data.initiator) &&
        this.isPhoneNumber(data.clientid)
      ) {
        Logger.log(
          `Initiator: ${data.initiator} ${data.clientid} ${data.reqid}`,
          `WS Gateway Get Socket Swap`
        );
        data.initiator = data.clientid;
      }

      const socket =
        this.clients[data.client_socket_id] ||
        this.clients[this.mapClients[data.initiator]];
      if (!socket || !socket.send) {
        if (data.client_host_name && data.client_host_name !== osHostname) {
         

          const cmdQueue = `/queue/${MOBILE_QUEUE_BASE_PATTERN.BACKEND_RES}_${data.client_host_name}`;
          this.queue
            .send(cmdQueue, data)
            .subscribe(() =>
              Logger.log(cmdQueue, 'WS Gateway sendToGateWay')
            );
          return null;
        }

        let newWS = null;
        for (const property in this.clients) {
          const currWS = this.clients[property];
          if (currWS && currWS.initiator === data.initiator) {
            newWS = currWS;
            break;
          }
        }

        if (newWS) {
          Logger.log(`${newWS.initiator}`, '`WS Gateway Loop Client');
          // LoggerfvService.sendToTelegram(
          //   `WS Gateway Loop Client`,
          //   `${newWS.initiator}`
          // );
          return newWS;
        }
        return null;
      }

      if (
        this.isPhoneNumber(data.initiator) &&
        !socket.initiator &&
        data.token &&
        data.state === State.COMPLETED &&
        data.result === ErrCode.SUCCESSFUL.code
      ) {
        // const mapClientId = this.mapClients[data.initiator];
        // const oldWs = this.clients[mapClientId];
        // if (oldWs) {
        // oldWs.terminate();
        // delete this.clients[mapClientId];
        // Logger.info(`${data.initiator}`, 'WS Delete Old');
        // }

        socket.initiator = data.initiator;
        // socket.is_login = true;
        this.mapClients[data.initiator] = data.client_socket_id;
      }
      return socket;
    } catch (err) {
      Logger.error(err, '', 'WS getSocket');
    }
  }

  cleanSocket() {
    try {
      clearInterval(this.cleanWsInterval);

      // Logger.log('cleanSocket', 'WS Gateway');
      const currentTime = new Date().getTime();
      for (const wsKey in this.clients) {
        const ws = this.clients[wsKey];

        if (
          // ws.is_alive === false ||
          currentTime - ws.start_at >= this.wsIdleTime &&
          !ws.is_login
        ) {
          ws.terminate();
          ws.initiator &&
            Logger.warn(
              `${ws.initiator} alive: ${ws.is_alive} login: ${ws.is_login}`,
              'WS Terminate cleanSocket'
            );
        } else {
          this.ping(ws);
        }
      }

      this.cleanWsInterval = setInterval(() => {
        this.cleanSocket();
      }, this.wsCleanTime);
    } catch (err) {
      Logger.error(`WS ping: ${err.message}`, '', 'WS cleanSocket');
    }
  }

  ping(ws) {
    try {
      if (!ws) return;
      ws.ping();
      ws.is_alive = false;
      Logger.log(`${ws.client_id}`, 'WS PING');
    } catch (err) {
      Logger.error(`WS ping: ${err.message}`, '', 'WS PING ERR');
    }
  }

  pong(ws, message) {
    try {
      ws.is_alive = true;
      Logger.log(
        message && message.data ? JSON.stringify(message.data) : 'Received',
        'WS PONG'
      );
    } catch (err) {
      Logger.error(`WS ping: ${err.message}`, '', 'WS PONG ERR');
    }
  }

  isPhoneNumber(phone: string) {
    try {
      if (!phone) return false;

      const phoneRex = /(0[3|5|7|8|9])+([0-9]{8})\b/g;

      return phoneRex.test(phone);
    } catch (err) {
      Logger.error(
        `WS ping: ${err.message}`,
        '',
        'Gateway isPhoneNumber Err'
      );
    }
  }
}
