import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdatePostDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    slug: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    brief?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    content?: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}
