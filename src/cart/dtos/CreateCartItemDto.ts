import {
    IsUUID,
    IsNumber,
    Min
} from "class-validator";

export class CreateCartItemDto {
    @IsUUID('4')
    productUuid: string;

    @IsUUID('4')
    variantUuid: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}
