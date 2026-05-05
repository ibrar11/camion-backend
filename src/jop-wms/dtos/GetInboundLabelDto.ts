import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInboundLabelDto {
    // One of the three identifiers is required
    @IsOptional()
    @IsString()
    inboundOrderId?: string;

    @IsOptional()
    @IsString()
    customerVoucherNo?: string;

    @IsOptional()
    @IsString()
    waybillNo?: string;

    // Label size: 10=10x10, 15=10x15, 20=A4, 6=10x6
    @IsInt()
    @IsIn([6, 10, 15, 20])
    @Type(() => Number)
    printType: number;
}
