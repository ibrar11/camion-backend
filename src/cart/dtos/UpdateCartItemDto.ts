import { IsNumber, Min, IsOptional, IsUUID } from "class-validator";

export class UpdateCartItemDto {

    @IsUUID()
    productUuid: string

    @IsOptional()
    @IsUUID()
    variantUuid: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity: number;
}
