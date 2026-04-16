import {
    IsArray,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateOrderDto {
    @IsString()
    paymentMethod: string;

    @IsArray()
    @IsUUID("all", { each: true })
    cartItemUuids: string[];
}