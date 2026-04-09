import {
	NestFactory,
	Reflector,
} from '@nestjs/core';
import {
	ClassSerializerInterceptor,
	ValidationPipe,
} from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	const allowedOrigins = configuredOrigins.length > 0
		? configuredOrigins
		: [
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3001",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		];

	app.enableCors({
		origin: (origin, callback) => {
			// Allow non-browser clients (no Origin header)
			if (!origin) {
				callback(null, true);
				return;
			}

			// If explicit allow-list is configured, enforce it.
			if (configuredOrigins.length > 0) {
				callback(null, allowedOrigins.includes(origin));
				return;
			}

			// Default local-dev policy: allow localhost/127.0.0.1 on any port.
			const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
			callback(null, isLocalOrigin);
		},
		credentials: true,
		methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});

	app.useGlobalPipes(new ValidationPipe({
		transform: true,
	}));
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)),);

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
