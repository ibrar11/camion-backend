import { 
    BadRequestException,
    createParamDecorator, 
    ExecutionContext 
} from '@nestjs/common';

// Extract customer from req
export const GetCustomer = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.customer;
    },
);