import * as stompit from 'stompit';
import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { QUEUE_PATTERN, TOPIC_DESTINATION } from '@nest-micro/constants';
import { ActiveMQBase } from './activemq-base';

export class ActiveMQPubSubServer
  extends Server
  implements CustomTransportStrategy {
  server = null;
  channel = null;
  manager = null;
  environment: any = {};
  activeMQBase: any = {};
  queuePatternArr: Array<string> = Object.values(QUEUE_PATTERN);
  heartBeatInvertal = null;

  constructor(environment?) {
    super();
    this.environment = environment || {};
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    this.start(callback);
  }

  async start(callback: () => void) {
    if (this.channel && this.channel._client != null && !this.channel._closed) {
      callback();
      return;
    }

    clearInterval(this.heartBeatInvertal);

    Logger.log('start', 'ActiveMQ Server');
    const createRes: any = await this.createClient();

    // this.server = createRes.client;
    this.channel = createRes.channel;

    this.activeMQBase = new ActiveMQBase(this.channel);

    const events = this.messageHandlers.keys();
    let event = events.next();

    while (event.value) {
      const eventValue = event.value.toUpperCase();
      const destinationPattern =
        this.queuePatternArr.indexOf(eventValue) >= 0
          ? `/queue/${eventValue}`
          : `/topic/${eventValue}`;

      this.activeMQBase.subscribe(
        destinationPattern,
        this.getHandlerByPattern(event.value)
      );
      event = events.next();
    }

    this.heartBeatInvertal = setInterval(() => {
      this.heartBeat();
    }, 8000);

    callback();
  }

  createClient() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createManager();

        const channel = new stompit.Channel(this.manager);
        ActiveMQBase.setSyncChannel(channel);
        resolve({ channel });
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
      console.log("===================",connectOptions)
      this.manager = new stompit.ConnectFailover([connectOptions]);
      ActiveMQBase.setManager(this.manager);
      Logger.log('New Manager', 'ActiveMQ Server');
      Logger.log(JSON.stringify(connectOptions), 'ActiveMQ Server')
      return this.manager;
    } catch (err) {
      Logger.error(err && err.message, '', 'Create Manager');
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

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    try {
      // this.server && this.server.disconnect();
      // this.server = null;

      if (this.channel) {
        this.channel.close();
        this.channel = null;
        ActiveMQBase.setSyncChannel(null);
        Logger.warn('Close', 'Server ActiveMQ');
      }
    } catch (err) {
      Logger.error(err && err.message, 'Close', 'Server ActiveMQ');
    }
  }

  handleControl(data) {
    if (!data || !Object.keys(data).length) return;

    if (data.cmd === 'ENABLE_DEBUG') {
      ActiveMQBase.enableDebugHandler();
    }

    if (data.cmd === 'DISABLE_DEBUG') {
      ActiveMQBase.disableDebugHandler();
    }

    if (data.cmd === 'DEBUG_STATUS') {
      ActiveMQBase.getDebugStatus();
    }
  }

  heartBeat() {
    try {
      this.channel.send(
        {
          destination: TOPIC_DESTINATION.ECOM_SERVICE_CONTROL,
          'content-type': 'text/plain'
        },
        JSON.stringify({ HEART_BEAT_START_TIME: Date.now() }),
        () => { }
      );
    } catch (err) {
      Logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
    }
  }
}
