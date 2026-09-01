import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreatePostDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    slug: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    titleAr: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    brief?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    briefAr?: string;

    @IsString()
    @MinLength(1)
    content: string;

    @IsString()
    @MinLength(1)
    contentAr: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}
