import { IsOptional, IsString } from 'class-validator';

export class InboundOrderStatusDto {
    // Either customerVoucherNo or inboundOrderId — WMS accepts one of the two
    @IsOptional()
    @IsString()
    customerVoucherNo?: string;

    @IsOptional()
    @IsString()
    inboundOrderId?: string;
}
