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

    @Post()
    @HttpCode(HttpStatus.CREATED)
    addToCart(
        @Body() dto: CreateCartItemDto,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        return this.cartService.create(dto, userId, guestId);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    getCart(
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        return this.cartService.findCart(userId, guestId);
    }

    @Patch('update')
    @HttpCode(HttpStatus.OK)
    updateCart(
        @Body() dto: UpdateCartItemDto,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        return this.cartService.update(dto, userId, guestId);
    }

    @Delete('remove')
    @HttpCode(HttpStatus.OK)
    async removeFromCart(
        @Body('productUuid') productUuid: string,
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        return this.cartService.removeItem(productUuid, userId, guestId);
    }

    @Delete('clear')
    @HttpCode(HttpStatus.OK)
    clearCart(
        @OptionalUserId() userId: string | undefined,
        @Headers('x-guest-id') guestId?: string,
    ) {
        return this.cartService.clearCart(userId, guestId);
    } 
}