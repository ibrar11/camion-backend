import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common';
import { OauthService } from './oauth.service';
import { TokenDto } from './dto/token.dto';

@Controller('v1/oauth')
export class OauthController {
    constructor(private readonly oauthService: OauthService) { }

    @Post('token')
    @HttpCode(HttpStatus.OK)
    async getToken(@Body() body: TokenDto) {
        return this.oauthService.generateToken(body);
    }
}
