import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { User } from 'src/users/entities/user.entity';
import { UserRole } from '../users/enums/UserRole';

import { Post as PostEntity } from './entities/post.entity';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    /**
     * Create post
     */
    @Post()
    @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
    @HttpCode(HttpStatus.CREATED)
    async actionCreatePost(
        @Body() body: CreatePostDto,
        @Req() request: Request & { user: unknown },
    ): Promise<PostEntity> {
        return this.postsService.create(body, request.user as User);
    }

    /**
     * Get all posts
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async actionGetPosts(): Promise<PostEntity[]> {
        return this.postsService.findAll();
    }

    /**
     * Get single post by uuid
     */
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    async actionGetPost(@Param('uuid') uuid: string): Promise<PostEntity> {
        return this.postsService.findOne(uuid);
    }

    /**
     * Update post
     */
    @Put(':uuid')
    @Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
    @HttpCode(HttpStatus.OK)
    async actionUpdatePost(
        @Param('uuid') uuid: string,
        @Body() body: UpdatePostDto,
    ): Promise<PostEntity> {
        return this.postsService.update(uuid, body);
    }

    /**
     * Delete post
     */
    @Delete(':uuid')
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @HttpCode(HttpStatus.OK)
    async actionDeletePost(@Param('uuid') uuid: string): Promise<void> {
        return this.postsService.delete(uuid);
    }
}
