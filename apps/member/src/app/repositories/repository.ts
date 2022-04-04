import { GATEWAY_MUTATE_CONN, GATEWAY_QUERY_CONN } from '@nest-micro/constants';
import { Inject } from '@nestjs/common';
import { Connection, Model, Schema } from 'mongoose';

export abstract class Repository {
  protected collection: string;
  protected schema: Schema;

  constructor(
    @Inject(GATEWAY_QUERY_CONN) protected readonly queryConn: Connection,
    @Inject(GATEWAY_MUTATE_CONN) protected readonly mutateConn: Connection
  ) {}

  protected get queryModel(): Model<any> {
    const models = this.queryConn.modelNames();
    return models.includes(this.collection)
      ? this.queryConn.model(this.collection)
      : this.queryConn.model(this.collection, this.schema);
  }

  protected get mutateModel(): Model<any> {
    const models = this.mutateConn.modelNames();
    return models.includes(this.collection)
      ? this.mutateConn.model(this.collection)
      : this.mutateConn.model(this.collection, this.schema);
  }
}
