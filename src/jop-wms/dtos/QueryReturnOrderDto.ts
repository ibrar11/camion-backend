import { IsString } from 'class-validator';

export class QueryReturnOrderDto {
    @IsString()
    warehouseCode: string;

    @IsString()
    waybillNo: string;
}
