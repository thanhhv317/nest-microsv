import { ModelsConfig } from '.';

export interface MongoDBAddonConfig {
  query: {
    name: string;
    url: string;
  };
  mutate: {
    name: string;
    url: string;
  };
  models: Array<ModelsConfig>;
  useNewUrlParser?: boolean;
  useFindAndModify?: boolean;
  useCreateIndex?: boolean;
  useUnifiedTopology?: boolean;
  autoCreate?: boolean;
}
