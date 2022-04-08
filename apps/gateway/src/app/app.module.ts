import { ResponderModule } from '@nest-micro/responder';
import { Module } from '@nestjs/common';
import { environment } from '../environments/environment';
import { WebsocketModule } from '../websocket/websocket.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ResponderModule.forRoot(environment),
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
