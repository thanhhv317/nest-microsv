import { DynamicModule, Module } from '@nestjs/common';
import { PROVIDER } from './constants';
import { FormatUtil, QueueUtil, ResponseUtil } from './utils';

@Module({})
export class ResponderModule {
  static forRoot(config: Partial<any>): DynamicModule {
    return {
      module: ResponderModule,
      imports: [],
      providers: [
        {
          provide: PROVIDER.RESPONDER,
          useValue: config
        },
        QueueUtil,
        FormatUtil,
        ResponseUtil
      ],
      exports: [QueueUtil, FormatUtil, ResponseUtil]
    };
  }
}
