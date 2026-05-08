import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookOAuthStrategy extends PassportStrategy(FacebookStrategy, 'facebook') {
	constructor(config: ConfigService) {
		super({
			clientID: config.get<string>('FACEBOOK_APP_ID') || '',
			clientSecret: config.get<string>('FACEBOOK_APP_SECRET') || '',
			callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL') || '/auth/facebook/callback',
			profileFields: ['id', 'displayName', 'emails'],
			scope: ['email'],
		});
	}

	validate(_accessToken: string, _refreshToken: string, profile: Profile) {
		const email = profile.emails?.[0]?.value || '';
		const fullName = profile.displayName || '';
		const facebookId = profile.id;
		return { email, fullName, facebookId };
	}
}
