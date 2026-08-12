import {
    IsEnum,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ClientRole } from '../enums/client-role.enum';

export class CreateClientDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(128)
    name: string;

    @IsString()
    @IsEnum(ClientRole)
    role: ClientRole;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsUrl()
    homepage?: string;
}
