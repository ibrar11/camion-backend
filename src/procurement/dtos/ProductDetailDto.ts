import { IsString } from 'class-validator';

export class ProductDetailDto {
    @IsString()
    productId: string;
}
