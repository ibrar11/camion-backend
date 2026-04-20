import { 
    IsUUID, 
    IsNumber, 
    Min 
} from "class-validator";

export class CreateCartItemDto {
    @IsUUID()
    productUuid: string;

    @IsUUID()
    variantUuid: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}
