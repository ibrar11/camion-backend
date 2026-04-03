import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from './entities/post.entity';

import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module'; 

@Module({
    imports: [
        TypeOrmModule.forFeature([Post]),
        AuthModule,
        UsersModule,
    ],
    providers: [PostsService],
    controllers: [PostsController],
})
export class PostsModule {}