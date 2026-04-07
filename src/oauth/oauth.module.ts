import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';

import { ClientsModule } from '../clients/clients.module';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([RefreshToken]),
        ConfigModule,
        forwardRef(() => ClientsModule),
    ],
    controllers: [OauthController],
    providers: [OauthService],
    exports: [OauthService],
})
export class OauthModule {}
