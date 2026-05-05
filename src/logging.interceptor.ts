import type { Request } from "express";

import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from "@nestjs/common";

import {
	Observable,
	tap,
} from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
		const now = Date.now();
		const request = context.switchToHttp().getRequest() as Request;

		return next.handle().pipe(
			tap(() => {
				const elapsed = Date.now() - now;
				this.logger.log(`${request?.method ?? "N/A"} ${request?.url ?? "N/A"} - ${elapsed}ms`);
			})
		);
	}
}
