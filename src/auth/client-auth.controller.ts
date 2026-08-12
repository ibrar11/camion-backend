import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
} from "@nestjs/common";

import { ClientTokenDto } from "./dtos/ClientTokenDto";

import { ClientAuthService } from "./client-auth.service";
import { ClientAuthResponse } from "./response/ClientAuthResponse";


@Controller("v1/auth/client")
export class ClientAuthController {
    constructor(
        @Inject(ClientAuthService) private readonly clientAuthService: ClientAuthService,
    ) { }

    @HttpCode(HttpStatus.CREATED)
    @Post('token')
    actionRegister(@Body() body: ClientTokenDto): Promise<ClientAuthResponse> {
        return this.clientAuthService.getToken(body);
    }
}
