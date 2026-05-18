// src/translation/translation-scanner.controller.ts
import { 
    Controller, 
    Get, 
    Inject, 
    Post, 
    UseGuards 
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/UserRole';

import { TranslationScannerService } from './translation-scanner.service';

import { 
    ProductTranslationScan, 
    ProductTranslationStats 
} from './types';

@Controller('v1/translation')
@UseGuards(AuthGuard, RolesGuard)
export class TranslationScannerController {
    constructor(@Inject(TranslationScannerService) private readonly translationScanner: TranslationScannerService) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('scan')
    async triggerManualScan(): Promise<ProductTranslationScan> {
        const result = await this.translationScanner.manualScanAndQueue();
        return result;
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('stats')
    async getTranslationStats(): Promise<ProductTranslationStats> {
        return this.translationScanner.getTranslationStats();
    }
}