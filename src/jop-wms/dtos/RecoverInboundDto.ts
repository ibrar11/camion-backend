import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class RecoverInboundDto {
    @IsArray()
    @IsUUID('4', { each: true })
    orderUuids: string[];

    @IsInt()
    @Min(0)
    @Max(4)
    shipperMethod: number;

    @IsOptional()
    @IsString()
    shipperCompany?: string;
}
