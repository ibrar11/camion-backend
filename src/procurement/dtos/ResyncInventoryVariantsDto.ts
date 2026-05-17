import {
    ArrayNotEmpty,
    IsIn,
    IsArray,
    IsOptional,
    IsUUID,
    ValidateIf,
} from "class-validator";

export class ResyncInventoryVariantsDto {
    @IsOptional()
    @IsIn(["all", "selected"])
    scope?: "all" | "selected";

    @ValidateIf((o: ResyncInventoryVariantsDto) => (o.scope ?? "selected") === "selected")
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("4", { each: true })
    productUuids?: string[];
}
