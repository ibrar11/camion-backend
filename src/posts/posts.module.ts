import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from './entities/post.entity';

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsResolver } from './posts.resolver';

import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module'; 

import { ClientsModule } from '../clients/clients.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Post]),
        AuthModule,
        UsersModule,
        ClientsModule,
    ],
    providers: [PostsService, PostsResolver],
    controllers: [PostsController],
})
export class PostsModule {}
