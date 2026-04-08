import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';

import { ClientsModule } from '../clients/clients.module';
import { ClientRefreshToken } from './entities/oauth-refresh-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ClientRefreshToken]),
        ConfigModule,
        forwardRef(() => ClientsModule),
    ],
    controllers: [OauthController],
    providers: [OauthService],
    exports: [OauthService],
})
export class OauthModule {}
