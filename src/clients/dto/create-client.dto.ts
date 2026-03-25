import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  homepage?: string;
}