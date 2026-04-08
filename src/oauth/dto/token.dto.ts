import { IsString, IsIn, IsOptional } from 'class-validator';

export class TokenDto {
    @IsOptional()
    @IsString()
    client_id?: string;

    @IsOptional()
    @IsString()
    client_secret?: string;

    @IsString()
    @IsIn(['client_credentials', 'refresh_token'])
    grant_type!: 'client_credentials' | 'refresh_token';

    @IsOptional()
    @IsString()
    refresh_token?: string;
}
