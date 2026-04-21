import {
    IsNumber,
    Min,
    IsOptional,
    IsUUID
} from "class-validator";

export class UpdateCartItemDto {

    @IsUUID('4')
    productUuid: string

    @IsOptional()
    @IsUUID('4')
    variantUuid: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity: number;
}
