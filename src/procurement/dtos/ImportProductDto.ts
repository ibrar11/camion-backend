import { 
    ArrayUnique,
    IsArray, 
    IsString 
} from "class-validator";

export class ImportProductDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayUnique({ message: "externalId values must be unique" })
    externalId: string[];
    
}