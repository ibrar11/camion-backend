import { Inject, UseGuards } from '@nestjs/common';
import { Args, Field, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

import { GqlAuthGuard } from '../auth/gql.guard';

@ObjectType()
export class PostAuthor {
    @Field()
    uuid: string;

    @Field()
    fullName: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Post)
export class PostsResolver {
    constructor(@Inject(PostsService) private readonly postsService: PostsService) {}

    @ResolveField('createdBy', () => PostAuthor)
    getAuthor(@Parent() post: Post): PostAuthor {
        return {
            uuid: post.createdBy.uuid,
            fullName: post.createdBy.fullName,
        };
    }

    @Query(() => [Post])
    getPosts(): Promise<Post[]> {
        return this.postsService.findAll();
    }

    @Query(() => Post)
    getPost(@Args('slug') slug: string): Promise<Post> {
        return this.postsService.findOneBySlug(slug);
    }
}
