import { IsString } from 'class-validator';

export class GetLogisticsDto {
    @IsString()
    warehouseCode: string;
}
