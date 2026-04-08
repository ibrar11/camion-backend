import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdatePostDto {
    @IsString()
    @MaxLength(255)
    slug: string;

    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    brief?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}
