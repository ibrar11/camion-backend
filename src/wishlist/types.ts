import { 
    ObjectType, 
    Field, 
    Int 
} from '@nestjs/graphql';

import { WishlistItem } from './entities/wishlist.entity';

@ObjectType()
export class WishlistResponse {
    @Field(() => Int)
    count: number;

    @Field(() => [WishlistItem])
    items: WishlistItem[];
}