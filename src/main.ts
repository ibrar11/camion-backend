import compression from "compression";

import {
	NestFactory,
	Reflector,
} from '@nestjs/core';

import {
	BadRequestException,
	ClassSerializerInterceptor,
	ValidationPipe,
} from '@nestjs/common';

import { ValidationError } from 'class-validator';

import { AppModule } from './app.module';
import { filter } from "rxjs";
import { Request, Response } from "express";

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
		stopAtFirstError: false,
		exceptionFactory: (errors: Array<ValidationError>) => {
			return new BadRequestException({
				errors: Object.fromEntries(
					errors.map((error) => [
						error.property,
						error.constraints !== null && error.constraints !== undefined
							? error.constraints[Object.keys(error.constraints)[0]]
							: "Validation failed"
					]),
				),
			});
		},
	}));

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	// Enable compression
	app.use(compression({
		filter: (req: Request, res: Response) => {
			if (req.headers["x-no-compression"]) {
				return false;
			}
			return compression.filter(req, res);
		},
	}));

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
