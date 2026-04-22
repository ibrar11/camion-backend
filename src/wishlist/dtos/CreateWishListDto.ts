import {
    IsUUID,
} from 'class-validator';

export class CreateWishlistDto {
    @IsUUID('4')
    productUUID: string;

    @IsUUID('4')
    variantUUID: string;
}
