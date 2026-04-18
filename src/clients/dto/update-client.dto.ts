import {
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength
} from 'class-validator';

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(128)
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsUrl()
    homepage?: string;
}
