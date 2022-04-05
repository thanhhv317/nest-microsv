/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

import { ActiveMQPubSubServer } from '@nest-micro/activemq';
import { environment } from './environments/environment';
import { CustomStrategy } from '@nestjs/microservices';
import { Tracer } from '@nest-micro/tracer';

Tracer.start({
  serviceName: 'consumer-gateway-srv',
  logger: console,
});


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const activeMQServer = new ActiveMQPubSubServer(environment);

  app.connectMicroservice<CustomStrategy>({
    strategy: activeMQServer
  });

  // start all microservices
  await app.startAllMicroservices();

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333;
  app.enableCors();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
