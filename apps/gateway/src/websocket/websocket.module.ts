import { TracerModule } from '@nest-micro/tracer';
import { Module } from '@nestjs/common';
import { CommandService } from '../command/command.service';
import { WebsocketGateway } from './websocket.gateway';

@Module({
    imports: [],
    providers: [WebsocketGateway, CommandService],
    exports: [WebsocketGateway, CommandService]
})
export class WebsocketModule {}
