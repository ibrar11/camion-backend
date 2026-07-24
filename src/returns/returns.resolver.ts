import {
    IsEnum,
    IsOptional,
} from "class-validator";

import {
    Args,
    ArgsType,
    Context,
    Field,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql";

import {
    ForbiddenException,
    Inject,
    UseGuards,
} from "@nestjs/common";

import { GqlAuthGuard } from "../auth/gql.guard";

import { ReturnRequest } from "./entities/return-request.entity";
import { ReturnStatus } from "./enums/ReturnStatus.enum";
import { ReturnsService } from "./returns.service";
import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

@ArgsType()
class GetMyReturnRequestsArgs {
    @Field(() => Int, { defaultValue: 1 })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 20 })
    itemsPerPage: number;

    @Field({ defaultValue: "usd", })
    currency: CurrencyCode;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsEnum(ReturnStatus)
    status?: ReturnStatus;
}

@ArgsType()
class GetMyReturnRequestArgs {
    @Field(() => String)
    uuid: string;

    @Field({ defaultValue: "usd", })
    currency: CurrencyCode;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => ReturnRequest)
export class ReturnsResolver {
    constructor(@Inject(ReturnsService) private readonly returnsService: ReturnsService) { }

    @Query(() => [ReturnRequest])
    getCurrentCustomerReturnRequests(
        @Context() context,
        @Args() args: GetMyReturnRequestsArgs,
    ): Promise<ReturnRequest[]> {
        if (!context.req?.customer?.uuid) {
            throw new ForbiddenException({
                error: "You are not allowed to retrieve return requests.",
            });
        }
        return this.returnsService.findAllByCustomer(
            context.req.customer.uuid,
            args.pageNumber,
            args.itemsPerPage,
            args.currency,
            args.status,
        );
    }

    @Query(() => ReturnRequest)
    getCurrentCustomerReturnRequest(
        @Context() context,
        @Args() args: GetMyReturnRequestArgs,
    ): Promise<ReturnRequest> {
        if (!context.req?.customer?.uuid) {
            throw new ForbiddenException({
                error: "You are not allowed to retrieve return requests.",
            });
        }
        return this.returnsService.findOne(args.uuid, args.currency);
    }
}
