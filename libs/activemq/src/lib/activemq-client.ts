import { TOPIC_DESTINATION } from '@nest-micro/constants'
import { Logger } from '@nestjs/common';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from './activemq-base';

export class ActiveMQPubSubClient extends ClientProxy {
  client = null;
  channel = null;
  manager = null;
  environment: any = {};
  activeMQBase: any = {};
  maxReconnect = 5;
  countReconnect = 0;
  isError = false;
  timeoutQueue = null;
  heartBeatInvertal = null;

  constructor(environment?) {
    super();
    this.environment = environment || {};
  }

  async connect(): Promise<any> {
    try {
      let startClient: any = await this.start();
      // const activeTime = 5 * 60 * 1000;
      // Logger.debug(
      //   JSON.stringify(this.client).replace(/\"/g, ''),
      //   'Client ActiveMQ Detail'
      // );
      // if (fvDuration < 10000 && Date.now() - startClient.start_at <= activeTime)
      this.close();
      // Logger.debug('Create New Client', 'Client ActiveMQ');
      startClient = await this.start();
      return startClient;
    } catch (err) {
    }
  }

  start() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isError && this.client) {
          // Logger.log('Return cache', 'Client ActiveMQ');
          return resolve(this.client);
        }

        clearInterval(this.heartBeatInvertal);

        Logger.log('Create Client', 'Client ActiveMQ');

        const createRes: any = await this.createClient();

        // this.channel = createRes.channel;

        // this.activeMQBase = new ActiveMQBase(this.channel, this.client);

        // Subscribe Control Queue
        // this.activeMQBase.subscribe(
        //   ActiveMQBase.generateQueueName(true),
        //   this.handleControl.bind(this)
        // );

        this.client.start_at = Date.now();

        this.heartBeatInvertal = setInterval(() => {
          this.heartBeat();
        }, 8000);

        resolve(this.client);
      } catch (err) {
      }
    });
  }

  createClient() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createManager();

        this.manager.connect((err, client, reconnect) => {
          if (err) {
            return reject(err);
          }

          this.client = client;
          Logger.log('CREATED', 'ActiveMQ New Client');

          client.on('error', (error) => {
            // ActiveMQBase.enableDebug &&
            Logger.debug(
              error && error.message ? error.message : JSON.stringify(error),
              'Client ActiveMQ Error'
            );
            // this.countReconnect++;

            // if (this.countReconnect > this.maxReconnect) {
            //   Logger.debug(
            //     'Reached Reconnect --- Stop Reconnect',
            //     'Client ActiveMQ Error'
            //   );
            //   this.isError = true;
            //   this.close();
            //   return;
            // }
            // client.disconnect(error);
            reconnect();
            // this.close();
          });

          // client.on('connect', () => {
          //   this.client = client;
          //   Logger.log('CONNECTED', 'ActiveMQ New Client');
          // });

          // client.on('end', () => {
          //   Logger.error('ENDED', '', 'ActiveMQ Client');
          // });

          // client.on('finish', () => {
          //   Logger.error('FINISHED', '', 'ActiveMQ Client');
          // });

          // client.on('close', () => {
          //   Logger.error('CLOSED', '', 'ActiveMQ Client');
          // });

          // const channel = new stompit.Channel(manager);
          const channel = {};

          resolve({ client, channel });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async createManager() {
    try {
      if (!this.manager) this.manager = ActiveMQBase.getManager();
      if (this.manager) return this.manager;

      const connectOptions = await this.getConfig();
      this.manager = new stompit.ConnectFailover([connectOptions]);
      ActiveMQBase.setManager(this.manager);
      Logger.log('New Manager', 'Client ActiveMQ');
      return this.manager;
    } catch (err) {
      Logger.error(err && err.message, '', 'Client Create Manager');
    }
  }

  async close() {
    try {
      if (this.client) {
        this.client && this.client.disconnect && this.client.disconnect();
        this.client && this.client.close && this.client.close();
        this.client = null;
        Logger.log('CLOSE', 'Client ActiveMQ');
      }
    } catch (err) {
      Logger.error(err && err.message, 'CLOSE', 'Client ActiveMQ');
    }
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return Logger.log(packet, 'Client ActiveMQ Dispatch');
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void
  ): () => void {
    try {
      // Logger.log(packet, 'Client ActiveMQ Send');
      // Toggle logger 202203111515

      // In a real-world application, the "callback" function should be executed
      // with payload sent back from the responder. Here, we'll simply simulate (5 seconds delay)
      // that response came through by passing the same "data" as we've originally passed in.
      // setTimeout(() => callback({ response: packet.data }), 5000);

      const sendHeaders = {
        destination: packet.pattern,
        'content-type': 'text/plain'
      };

      if (this.client && this.client.send && !this.client._destroyed) {
        // this.client.send(sendHeaders, JSON.stringify(packet.data));
        const frame = this.client.send(sendHeaders);
        frame.write(JSON.stringify(packet.data));
        frame.end();
        callback({ response: packet });
      } else {
        (async () => {
          await this.createClient();
          const frame = this.client.send(sendHeaders);
          frame.write(JSON.stringify(packet.data));
          frame.end();

          callback({ response: packet });
        })();
      }

      return () => Logger.log('teardown', 'Client ActiveMQ');
    } catch (err) {
      Logger.error(err, '', 'ActiveMQ Send Error');
    }
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      try {
        resolve({
          host: this.environment.activemq_host,
          port: this.environment.activemq_port,
          connectHeaders: {
            host: this.environment.activemq_connect_host,
            login: this.environment.activemq_connect_login,
            passcode: this.environment.activemq_connect_passcode,
            'heart-beat': this.environment.activemq_connect_heart_beat
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  handleControl(data) {
    // if (!data || !Object.keys(data).length) return;
    // if (data.cmd === 'ENABLE_DEBUG') {
    //   ActiveMQBase.enableDebugHandler();
    // }
    // if (data.cmd === 'DISABLE_DEBUG') {
    //   ActiveMQBase.disableDebugHandler();
    // }
    // if (data.cmd === 'DEBUG_STATUS') {
    //   ActiveMQBase.getDebugStatus();
    // }
  }

  heartBeat() {
    try {
      this.publish(
        {
          pattern: TOPIC_DESTINATION.LOYALTY_SERVICE_CONTROL,
          data: { HEART_BEAT_START_TIME: Date.now() }
        },
        () => {}
      );
    } catch (err) {
      Logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
    }
  }
}
