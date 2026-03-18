import { IsOptional, IsString, IsUrl, MaxLength, IsIn } from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  homepage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive', 'Banned'])
  status?: 'Active' | 'Inactive' | 'Banned';
}