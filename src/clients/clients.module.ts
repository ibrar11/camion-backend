import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

import { UsersModule } from '../users/users.module';
import { OauthModule } from '../oauth/oauth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    forwardRef(() => UsersModule),
    forwardRef(() => OauthModule),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }
