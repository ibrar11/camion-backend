import {
    BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
    Headers,
    Patch,
    UseGuards,
    Param
} from '@nestjs/common';

import { CreateCartItemDto } from './dtos/CreateCartItemDto';
import { UpdateCartItemDto } from './dtos/UpdateCartItemDto';

import { CartService } from './cart.service';

import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { OptionalUserId } from 'src/auth/optional-user-id.decorator';

@UseGuards(OptionalAuthGuard)
@Controller('v1/cart')
export class CartController {
    constructor(
        @Inject(CartService)
        private readonly cartService: CartService,
    ) {}

    private getIdentifier(UserUuid?: string, guestId?: string): string {
        if (UserUuid) return UserUuid;
        if (guestId) return guestId;
        throw new BadRequestException(
            'Either UserUuid or guestId must be provided.',
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    addToCart(
        @Body() dto: CreateCartItemDto,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        const identifier = this.getIdentifier(userId, guestId);
        const isGuest = !userId;
        return this.cartService.create(identifier, dto, isGuest);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    getCart(
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        const identifier = this.getIdentifier(userId, guestId);
        return this.cartService.findCart(identifier, !userId);
    }

    @Patch('update/:cartUuid')
    @HttpCode(HttpStatus.OK)
    updateCart(
        @Body() dto: UpdateCartItemDto,
        @Param('cartUuid') cartUuid: string,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        const identifier = this.getIdentifier(userId, guestId);
        const isGuest = !userId;
        return this.cartService.update(identifier, cartUuid, dto, isGuest);
    }

    @Delete('remove')
    @HttpCode(HttpStatus.OK)
    async removeFromCart(
        @Body('uuid') uuid: string,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        if (!uuid) {
            throw new BadRequestException('uuid is required');
        }

        const identifier = this.getIdentifier(userId, guestId);
        const isGuest = !userId;

        return this.cartService.removeItem(identifier, uuid, isGuest);
    }

    @Delete('clear')
    @HttpCode(HttpStatus.OK)
    clearCart(
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        const identifier = this.getIdentifier(userId, guestId);
        return this.cartService.clearCart(identifier);
    } 
}