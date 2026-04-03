import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) {}

    /**
     * Creates a post
     *
     * @param body - The payload to create a post
     * @param author - The user creating the post
     * @returns The created post entity
     */
    async create(body: CreatePostDto, author: User): Promise<Post> {
        const post: Post = this.postRepository.create({
            uuid: randomUUID(),
            slug: body.slug,
            title: body.title,
            brief: body.brief,
            content: body.content,
            enabled: body.enabled ?? true,
            images: body.images,
            author: author,
        });

        return this.postRepository.save(post);
    }

    /**
     * Retrieves all posts
     *
     * @returns A list of posts
     */
    async findAll(): Promise<Post[]> {
        return this.postRepository.find({
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieves a post by UUID
     *
     * @param uuid - The UUID of the post
     * @returns The post entity
     */
    async findOne(uuid: string): Promise<Post> {
        const post: Post | null = await this.postRepository.findOne({
            where: { uuid: uuid },
            relations: ['author'],
        });

        if (post === null) {
            throw new NotFoundException({
                error: 'Failed to find the post. Please check and try again.',
            });
        }

        return post;
    }

    /**
     * Updates a post
     *
     * @param uuid - The UUID of the post
     * @param body - The payload containing updated fields
     * @returns The updated post entity
     */
    async update(uuid: string, body: UpdatePostDto): Promise<Post> {
        const post: Post = await this.findOne(uuid);

        if (body.slug !== undefined) {
            post.slug = body.slug;
        }

        if (body.title !== undefined) {
            post.title = body.title;
        }

        if (body.brief !== undefined) {
            post.brief = body.brief;
        }

        if (body.content !== undefined) {
            post.content = body.content;
        }

        if (body.enabled !== undefined) {
            post.enabled = body.enabled;
        }

        if (body.images !== undefined) {
            post.images = body.images;
        }

        return this.postRepository.save(post);
    }

    /**
     * Deletes a post
     *
     * @param uuid - The UUID of the post
     * @returns void
     */
    async delete(uuid: string): Promise<void> {
        const result = await this.postRepository.delete({ uuid: uuid });

        if (result.affected === 0) {
            throw new NotFoundException({
                error: 'Failed to delete the post. Please check and try again.',
            });
        }
    }
}
