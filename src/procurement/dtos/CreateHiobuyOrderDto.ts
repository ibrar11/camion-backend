import {
    IsArray,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsNotEmptyObject,
    IsObject,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HiobuyReceiverDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    mobile: string;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsString()
    @IsNotEmpty()
    address: string;
}

export class HiobuyOrderLineDto {
    @IsString()
    @IsNotEmpty()
    offer_id: string;

    @IsString()
    @IsNotEmpty()
    spec_id: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateHiobuyOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => HiobuyOrderLineDto)
    lines: HiobuyOrderLineDto[];

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => HiobuyReceiverDto)
    receiver: HiobuyReceiverDto;
}
