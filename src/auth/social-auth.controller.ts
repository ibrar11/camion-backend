import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';

import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { CustomerAuthService } from './customer-auth.service';

@Controller('auth')
export class SocialAuthController {
	constructor(
		@Inject(CustomerAuthService) private readonly customerAuthService: CustomerAuthService,
	) { }

	@Get('google')
	@UseGuards(PassportAuthGuard('google'))
	actionGoogleWebAuth() {
		return;
	}

	@Get('google/callback')
	@UseGuards(PassportAuthGuard('google'))
	async actionGoogleWebCallback(
		@Req() req: Request & { user: { email: string; fullName: string; googleId: string } },
		@Res() res: Response,
	) {
		const result = await this.customerAuthService.loginWithGoogleWeb(req.user);

		const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
		const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'none';
		const secure = process.env.COOKIE_SECURE === 'true' || sameSite === 'none';

		res.cookie('token', result.token, {
			httpOnly: false,
			secure,
			sameSite,
			domain: cookieDomain,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/',
		});

		return res.redirect(302, process.env.FRONTEND_REDIRECT_URL || 'https://camion-app.com/auth/success');
	}
}
