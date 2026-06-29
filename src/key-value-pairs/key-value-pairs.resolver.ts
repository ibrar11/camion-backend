import { IsEnum, IsOptional, IsUUID } from "class-validator";

import {
    Args,
    ArgsType,
    Context,
    Field,
    Int,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from "@nestjs/graphql";

import {
    ForbiddenException,
    Inject,
    UseGuards
} from "@nestjs/common";

import { GqlAuthGuard } from "../auth/gql.guard";

import { KeyValuePair } from "./entities/key-value-pair.entity";
import { KeyValuePairsService } from "./key-value-pairs.service";

@ArgsType()
export class GetKeyValuePairArgs {
    @Field({ defaultValue: "usd", })
    currency: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => KeyValuePair)
export class KeyValuePairResolver {
    constructor(@Inject(KeyValuePairsService) private readonly keyValuePairsService: KeyValuePairsService) { }

    @Query(() => KeyValuePair)
    getMinimumOrderValue(@Context() context, @Args() args: GetKeyValuePairArgs): Promise<KeyValuePair> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve key value pairs. Please check and try again.",
            });
        }
        return this.keyValuePairsService.findMinimumOrderAmount(args.currency);
    }

    @Query(() => KeyValuePair)
    getFreeShippingValue(@Context() context, @Args() args: GetKeyValuePairArgs): Promise<KeyValuePair> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve key value pairs. Please check and try again.",
            });
        }
        return this.keyValuePairsService.findFreeShippingAmount(args.currency);
    }

}
