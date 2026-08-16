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

import { SavedCard } from "./entities/saved-card.entity";
import { SavedCardsService } from "./saved-cards.service";

@ArgsType()
export class GetCustomerAddressesArgs {
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 24, })
    itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => SavedCard)
export class SavedCardsResolver {
    constructor(@Inject(SavedCardsService) private readonly savedCardsService: SavedCardsService) { }

    @Query(() => [SavedCard])
    getCustomerSavedCards(@Context() context, @Args() args: GetCustomerAddressesArgs): Promise<Array<SavedCard>> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer saved cards. Please check and try again.",
            });
        }
        return this.savedCardsService.getSavedCards(context.req.customer.uuid, args.pageNumber, args.itemsPerPage);
    }
}
