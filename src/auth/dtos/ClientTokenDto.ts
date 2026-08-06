import { IsString, IsUUID } from 'class-validator';

export class ClientTokenDto {
  @IsString()
  @IsUUID('4')
  clientId: string;

  @IsString()
  clientSecret: string;
}
