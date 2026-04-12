import { 
    ObjectType, 
    Field, 
    Int 
} from '@nestjs/graphql';

import { WishlistItem } from './entities/wishlist.entity';

@ObjectType()
export class GqlWishlistResponse {
    @Field(() => Int)
    wishListCount: number;

    @Field(() => [WishlistItem])
    wishListItems: WishlistItem[];
}