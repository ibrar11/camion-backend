import {
    ArrayNotEmpty,
    IsArray,
    IsUUID,
} from "class-validator";

export class ResyncInventoryVariantsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("4", { each: true })
    productUuids: string[];
}
