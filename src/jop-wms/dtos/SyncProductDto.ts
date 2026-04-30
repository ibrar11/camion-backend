import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncProductDto {
    @IsUUID()
    variantUuid: string;

    // 0 = new (Added), 1 = update (Change). Defaults to 1 (Change) per WMS spec.
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    synchronizeType?: number = 1;
}
