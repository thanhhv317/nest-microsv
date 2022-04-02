import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USERS } from '../constants';

@Schema({
  collection: USERS,
  timestamps: true,
})
export class AgentRef {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  phone: string;
}

export const AgentRefSchema = SchemaFactory.createForClass(AgentRef);
