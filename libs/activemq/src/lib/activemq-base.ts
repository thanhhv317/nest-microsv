import { Logger } from '@nestjs/common';

export class ActiveMQBase {
  private channel: any = {};
  static syncChannel = null;
  static client: any = {};
  static manager = null;
  static enableDebug: boolean;

  constructor(channel) {
    this.channel = channel;
  }

  subscribe(topic, callback) {
    try {
      Logger.log(topic, 'Server ActiveMQ Subscribe');
      this.channel.subscribe(
        {
          destination: `${topic}`,
          ack: 'client'
        },
        (err, message) => {
          if (err) {
            // this.client.destroy(err);
            Logger.error(err.message, '', 'Server ActiveMQ Subscribe');
            return;
          }

          try {
            message.readString(
              'utf-8',
              this.synchronisedHandler(async (error, body) => {
                if (error) {
                  // this.client.destroy(error);
                  Logger.error(error.message, 'Server ActiveMQ Read String');
                  return;
                }

                // const fvTimer = TimerService.start(
                //   'Server ActiveMQ readString'
                // );
                const jsonData = JSON.parse(body);

                if (jsonData && !jsonData.HEART_BEAT_START_TIME) {
                  Logger.log(
                    `${jsonData.reqid ? jsonData.reqid : ''} ${jsonData.cmdtype ? jsonData.cmdtype : ''
                    } ${jsonData.initiator ? jsonData.initiator : ''}`,
                    `Server ActiveMQ readString`
                  );
                }
                callback(jsonData);
                // TimerService.duration(
                //   fvTimer,
                //   `Server ActiveMQ ${
                //     jsonData && jsonData.reqid ? jsonData.reqid : ''
                //   } ${jsonData && jsonData.cmdtype ? jsonData.cmdtype : ''} ${
                //     jsonData && jsonData.initiator ? jsonData.initiator : ''
                //   }`
                // );
              })
            );
          } catch (readErr) {
            Logger.error(readErr.message, 'Server ActiveMQ Read String');
          } finally {
            this.channel.ack(message);
          }
        }
      );
    } catch (err) {
      Logger.error(err.message, '', 'ActiveMQ Subscribe Error');
    }
  }

  synchronisedHandler(callback) {
    try {
      let processing = false;
      let nextMessage = null;

      const next = function () {
        if (nextMessage === null) {
          processing = false;
          return;
        }

        const currentMessage = nextMessage;

        nextMessage = null;

        callback.apply(null, ...currentMessage);
      };

      return function (error, message) {
        if (processing) {
          nextMessage = [error, message, next];
          return;
        }

        processing = true;

        callback(error, message, next);
      };
    } catch (err) {
    }
  }

  static enableDebugHandler() {
    ActiveMQBase.enableDebug = true;
    Logger.log(ActiveMQBase.enableDebug, 'Enable Debug ActiveMQ');
  }

  static disableDebugHandler() {
    ActiveMQBase.enableDebug = false;
    Logger.log(ActiveMQBase.enableDebug, 'Disable Debug ActiveMQ');
  }

  static getDebugStatus() {
    Logger.log(ActiveMQBase.enableDebug, 'Logger Debug ActiveMQ');
  }

  static setManager(manager) {
    this.manager = manager;
  }

  static getManager() {
    return this.manager;
  }

  static setSyncChannel(channel) {
    this.syncChannel = channel;
  }

  static getSyncChannel() {
    return this.syncChannel;
  }
}
