import { IsUUID } from 'class-validator';

export class CreateWishlistDto {
    @IsUUID('4')
    productUuid: string;
}
