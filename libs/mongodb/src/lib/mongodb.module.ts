import { DynamicModule, Module } from '@nestjs/common';
import { MongoDBAddonConfig } from './interfaces';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';


@Module({})
export class MongoDbModule {
  static forRoot(config: MongoDBAddonConfig): DynamicModule {
    this.checkMongoDbConfig(config);
    const { query, mutate } = config;
    const parsedConfig = {
      useNewUrlParser: config.useNewUrlParser || true,
      useUnifiedTopology: config.useUnifiedTopology || true,
      autoCreate: config.autoCreate || false
    };
    return {
      module: MongoDbModule,
      imports: [
        MongooseModule.forRoot(query.url, {
          connectionName: query.name,
          ...parsedConfig
        }),
        MongooseModule.forRoot(mutate.url, {
          connectionName: mutate.name,
          ...parsedConfig
        }),
        MongooseModule.forFeature(config.models, mutate.name)
      ],
      providers: [
        {
          provide: query.name,
          useFactory: (connection: Connection): Connection => {
            return connection;
          },
          inject: [getConnectionToken(query.name)]
        },
        {
          provide: mutate.name,
          useFactory: (connection: Connection): Connection => {
            return connection;
          },
          inject: [getConnectionToken(mutate.name)]
        }
      ],
      exports: [query.name, mutate.name]
    };


  }
  private static checkMongoDbConfig(config: MongoDBAddonConfig) {
    if (!config) {
      throw Error('Config is not provided');
    }
  }
}