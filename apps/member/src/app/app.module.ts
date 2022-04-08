import { GATEWAY_MUTATE_CONN, GATEWAY_QUERY_CONN } from '@nest-micro/constants';
import { ResponderModule } from '@nest-micro/responder';
import { Module } from '@nestjs/common';
import { environment } from '../environments/environment';
import { Users, UserSchema } from '../schemas';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersRepository } from './repositories';
import { MongoDbModule } from '@nest-micro/mongodb';

@Module({
  imports: [
    ResponderModule.forRoot(environment),
    MongoDbModule.forRoot({
      query: {
        name: GATEWAY_QUERY_CONN,
        url: environment.mongodb_query_url
      },
      mutate: {
        name: GATEWAY_MUTATE_CONN,
        url: environment.mongodb_mutate_url
      },
      models: [
        { name: Users.name, schema: UserSchema },
      ],
      autoCreate: true
    }
    ),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UsersRepository
  ],
})
export class AppModule { }
