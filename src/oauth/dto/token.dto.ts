import { IsString, IsIn, IsOptional, MinLength } from 'class-validator';

export class TokenDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    client_id?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    client_secret?: string;

    @IsString()
    @IsIn(['client_credentials', 'refresh_token'])
    grant_type!: 'client_credentials' | 'refresh_token';

    @IsOptional()
    @IsString()
    @MinLength(1)
    refresh_token?: string;
}
