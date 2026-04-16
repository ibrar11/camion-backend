import { 
    IsNumber, 
    IsOptional, 
    IsString 
} from "class-validator";

export class SkipcashWebhookDto {
    @IsString()
    PaymentId: string;

    @IsString()
    Amount: string;

    @IsNumber()
    StatusId: number;

    @IsOptional()
    @IsString()
    TransactionId?: string;

    @IsOptional()
    @IsString()
    Custom1?: string;

    @IsString()
    VisaId: string;
}