import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreatePostDto {
    @IsString()
    @MaxLength(255)
    slug: string;

    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    brief?: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}
