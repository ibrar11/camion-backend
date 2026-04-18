import {
    IsArray,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateOrderDto {
    @IsString()
    @MinLength(1)
    paymentMethod: string;

    @IsArray()
    @IsUUID("all", { each: true })
    cartItemUuids: string[];
}
