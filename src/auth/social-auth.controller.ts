import { Controller, ExecutionContext, Get, Inject, Injectable, Query, Req, Res, UseGuards } from '@nestjs/common';

import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { CustomerAuthService } from './customer-auth.service';

@Injectable()
class GoogleOAuthInitGuard extends PassportAuthGuard('google') {
	getAuthenticateOptions(context: ExecutionContext) {
		const req: Request = context.switchToHttp().getRequest();
		const guestUUID = req.query?.guestUUID as string | undefined;
		return guestUUID ? { state: guestUUID } : {};
	}
}

@Injectable()
class FacebookOAuthInitGuard extends PassportAuthGuard('facebook') {
	getAuthenticateOptions(context: ExecutionContext) {
		const req: Request = context.switchToHttp().getRequest();
		const guestUUID = req.query?.guestUUID as string | undefined;
		return guestUUID ? { state: guestUUID } : {};
	}
}

@Controller('auth')
export class SocialAuthController {
	constructor(
		@Inject(CustomerAuthService) private readonly customerAuthService: CustomerAuthService,
	) { }

	@Get('google')
	@UseGuards(GoogleOAuthInitGuard)
	actionGoogleWebAuth() {
		return;
	}

	@Get('google/callback')
	@UseGuards(PassportAuthGuard('google'))
	async actionGoogleWebCallback(
		@Req() req: Request & { user: { email: string; fullName: string; googleId: string } },
		@Query('state') guestUUID: string | undefined,
		@Res() res: Response,
	) {
		const result = await this.customerAuthService.loginWithGoogleWeb(req.user, guestUUID);
		return this.redirectWithToken(res, result.token);
	}

	@Get('facebook')
	@UseGuards(FacebookOAuthInitGuard)
	actionFacebookWebAuth() {
		return;
	}

	@Get('facebook/callback')
	@UseGuards(PassportAuthGuard('facebook'))
	async actionFacebookWebCallback(
		@Req() req: Request & { user: { email: string; fullName: string; facebookId: string } },
		@Query('state') guestUUID: string | undefined,
		@Res() res: Response,
	) {
		const result = await this.customerAuthService.loginWithFacebookWeb(req.user, guestUUID);
		return this.redirectWithToken(res, result.token);
	}

	private redirectWithToken(res: Response, token: string) {
		const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
		const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'none';
		const secure = process.env.COOKIE_SECURE === 'true' || sameSite === 'none';

		res.cookie('token', token, {
			httpOnly: false,
			secure,
			sameSite,
			domain: cookieDomain,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/',
		});

		return res.redirect(302, process.env.FRONTEND_REDIRECT_URL || 'https://app.dev.camiontrading.com/en');
	}
}
