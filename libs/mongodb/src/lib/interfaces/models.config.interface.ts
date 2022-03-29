import { Schema } from 'mongoose';

export interface ModelsConfig {
  name: string;
  schema: Schema<any>;
}
