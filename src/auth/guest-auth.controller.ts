import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
} from "@nestjs/common";

import { RegisterGuestDto } from "./dtos/RegisterGuestDto";
import { CustomerAuthResponse } from "./response/CustomerAuthResponse";

import { GuestAuthService } from "./guest-auth.service";

@Controller("v1/auth/guest")
export class GuestAuthController {
	constructor(
		@Inject(GuestAuthService) private readonly guestAuthService: GuestAuthService,
	) { }

	@HttpCode(HttpStatus.CREATED)
	@Post('register')
	actionRegister(@Body() body: RegisterGuestDto): Promise<CustomerAuthResponse> {
		return this.guestAuthService.registerGuest(body);
	}
}
