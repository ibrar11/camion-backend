import { IsString } from 'class-validator';

export class CancelOrderDto {
    @IsString()
    deposeMemo: string;
}
