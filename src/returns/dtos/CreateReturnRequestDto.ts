import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from "class-validator";

import { ReturnReason } from "../enums/ReturnReason.enum";

export class CreateReturnRequestDto {
    @IsUUID("4")
    orderUuid: string;

    @IsOptional()
    @IsUUID("4")
    orderItemUuid?: string;

    @IsEnum(ReturnReason)
    reason: ReturnReason;

    @IsString()
    @MinLength(10)
    reasonDetail: string;
}
