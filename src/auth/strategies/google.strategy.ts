import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(GoogleStrategy, 'google') {
	constructor(config: ConfigService) {
		super({
			clientID: config.get<string>('GOOGLE_CLIENT_ID') || '',
			clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || '',
			callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || '/v1/auth/customer/oauth/google/callback',
			scope: ['profile', 'email'],
		});
	}

	validate(_accessToken: string, _refreshToken: string, profile: Profile) {
		const email = profile.emails?.[0]?.value || '';
		const fullName = profile.displayName || '';
		const googleId = profile.id;
		return { email, fullName, googleId };
	}
}
