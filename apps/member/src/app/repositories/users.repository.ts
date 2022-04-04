import { Injectable, OnModuleInit } from '@nestjs/common';
import { USERS } from '../../constants';
import { UserSchema } from '../../schemas';
import { Repository } from './repository';

@Injectable()
export class UsersRepository extends Repository implements OnModuleInit {
  onModuleInit() {
    this.collection = USERS;
    this.schema = UserSchema;
  }

  async createUser(payload, options?: any) {
      const user = new this.mutateModel(payload);
      return await user.save();
  }


  async getOneDocument(query, options?: any) {
    return this.mutateModel.findOne(query, options ? options : {}).exec();
  }
}
