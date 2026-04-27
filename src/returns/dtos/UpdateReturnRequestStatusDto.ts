import {
    IsEnum,
    IsOptional,
    IsString,
} from "class-validator";

import { ReturnStatus } from "../enums/ReturnStatus.enum";

export class UpdateReturnRequestStatusDto {
    @IsEnum(ReturnStatus)
    status: ReturnStatus;

    @IsOptional()
    @IsString()
    adminNote?: string;
}
