import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    brief?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @IsOptional()
    @IsArray()
    images?: string[];
}
