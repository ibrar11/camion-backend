import crypto from 'node:crypto';

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { calculateStock } from '../common/calculateStock';
import { getSkipAndTake } from '../common/pagination';

import { CreateCartItemDto } from './dtos/CreateCartItemDto';
import { AddBundleToCartDto } from './dtos/AddBundleToCartDto';
import { UpdateCartItemDto } from './dtos/UpdateCartItemDto';

import { ProductStatus } from 'src/inventory/enums/ProductStatus.enum';

import { CartItem } from './entities/cart-items.entity';
import { Product } from '../inventory/entities/product.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { Customer } from '../customers/entities/customer.entity';

import { PricingService } from '../pricing/pricing.service';

import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';

import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import { getBestCampaign } from '../common/bestCampaign';

import { multiplyMoney } from '../common/currency';
import { BundlesService } from '../bundles/bundles.service';

type BundleSelectionContext = {
  bundleSourceUuid: string;
  bundleSelectionUuid: string;
  bundleMinimumSelectionCount: number;
};

@Injectable()
export class CartItemsService {
  private readonly logger = new Logger(CartItemsService.name);

  constructor(
    @Inject(PricingService) private readonly pricingService: PricingService,
    @Inject(BundlesService) private readonly bundlesService: BundlesService,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Add the product to cart
   * @param customer
   * @param body
   * @returns
   */
  async create(customer: Customer, body: CreateCartItemDto): Promise<CartItem> {
    return this.createWithSelectionContext(customer, body);
  }

  private async createWithSelectionContext(
    customer: Customer,
    body: CreateCartItemDto,
    bundleSelectionContext?: BundleSelectionContext | null,
  ): Promise<CartItem> {
    this.logger.log(
      `Attempting to add to cart for product: ${body.productUuid}`,
    );

    if (customer?.cartItemsCount >= 100) {
      throw new BadRequestException({
        error: 'Cart is full. To add the item first remove an item from cart.',
      });
    }

    // find the product needs to be added
    const product = await this.productRepository.findOne({
      where: { uuid: body.productUuid },
      relations: {
        variants: {
          inventoryItem: {
            levels: true,
          },
        },
        productCategories: {
          category: {
            campaignCategories: {
              campaign: true,
            },
          },
        },
      },
    });

    // Make sure the product exists and is available for sale.
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException({
        error: 'Product not available',
      });
    }

    if (!product.variants || !Array.isArray(product.variants)) {
      throw new BadRequestException({
        error:
          'Failed to find any variant of the product. Please check and try again.',
      });
    }

    // find the specific variant from the product
    const variant = product.variants.find(
      (variant) => variant.uuid === body.variantUuid,
    );
    if (!variant) {
      throw new NotFoundException({
        error:
          'Failed to find the requested variant. Please check and try again.',
      });
    }

    // check the variant stock availability
    const availableStock = calculateStock(variant);
    if (availableStock <= 0) {
      throw new BadRequestException({
        error: 'Product is out of stock',
      });
    }

    // Make sure the product is in sufficient quantity
    if (availableStock < body.quantity) {
      throw new BadRequestException({
        error: 'Insufficient stock',
      });
    }

    const campaign = getBestCampaign(product);

    // Calculate the price of the product/variant
    // const price = await this.pricingService.applyPriceOnProductVariant(product, variant, null, body.currency, false);
    const price = await this.pricingService.applyPriceOnProductVariant(
      product,
      variant,
      campaign,
      body.currency,
      true,
    );

    // check if the variant already exists
    const existingCartItem = await this.cartRepository.findOne({
      where: {
        customer: { uuid: customer.uuid },
        product: { uuid: body.productUuid },
        variant: { uuid: body.variantUuid },
        bundleSourceUuid:
          bundleSelectionContext?.bundleSourceUuid ?? IsNull(),
        bundleSelectionUuid:
          bundleSelectionContext?.bundleSelectionUuid ?? IsNull(),
      },
    });

    // Update the existing cart item if it exists
    if (existingCartItem) {
      const updatedQuantity = existingCartItem.quantity + body.quantity;

      if (availableStock < updatedQuantity) {
        throw new BadRequestException({
          error: 'Not enough stock available',
        });
      }

      const updatedPrice = multiplyMoney(price, updatedQuantity);
      existingCartItem.quantity = updatedQuantity;
      existingCartItem.subTotal = updatedPrice;
      existingCartItem.discountPrice = {
        amount: 0,
        minorAmount: 0,
        currencyCode: price.currencyCode,
      };
      existingCartItem.total = updatedPrice;
      const saved = await this.cartRepository.save(existingCartItem);
      return this.repriceAndPersistCustomerCart(
        customer,
        body.currency,
        undefined,
        saved.uuid,
      );
    }

    // Reset prodcut variants
    product.variants = [];
    product.productCategories = [];

    // Create a new cart item
    const cartItem = new CartItem();
    cartItem.uuid = crypto.randomUUID();
    cartItem.customer = customer;
    cartItem.product = product;
    cartItem.variant = variant;
    cartItem.quantity = body.quantity;
    cartItem.bundleSourceUuid = bundleSelectionContext?.bundleSourceUuid ?? null;
    cartItem.bundleSelectionUuid =
      bundleSelectionContext?.bundleSelectionUuid ?? null;
    cartItem.bundleMinimumSelectionCount =
      bundleSelectionContext?.bundleMinimumSelectionCount ?? 0;

    const newItemPrice = multiplyMoney(price, body.quantity);

    cartItem.subTotal = newItemPrice;

    cartItem.discountPrice = {
      amount: 0,
      minorAmount: 0,
      currencyCode: price.currencyCode,
    };

    cartItem.total = newItemPrice;
    const savedCartItem = await this.cartRepository.save(cartItem);

    customer.cartItemsCount++;
    await this.customerRepository.save(customer);

    return this.repriceAndPersistCustomerCart(
      customer,
      body.currency,
      undefined,
      savedCartItem.uuid,
    );
  }

  async createBundle(
    customer: Customer,
    body: AddBundleToCartDto,
  ): Promise<Array<CartItem>> {
    this.logger.log(`Attempting to add bundle to cart: ${body.bundleUuid}`);

    const bundleSelection = await this.bundlesService.getBundleForCartAdd(
      body.bundleUuid,
      body.currency,
      body.countryCode,
      body.items,
    );
    const multiplier = Math.max(1, Number(body.quantity || 1));
    const bundleSelectionUuid = bundleSelection.treatAsBundle
      ? crypto.randomUUID()
      : null;

    for (const item of bundleSelection.selectedItems) {
      if (!item.product?.uuid || !item.variant?.uuid) {
        throw new BadRequestException({
          error:
            'Bundle item is missing a valid product or variant. Please check and try again.',
        });
      }

      await this.createWithSelectionContext(
        customer,
        {
          productUuid: item.product.uuid,
          variantUuid: item.variant.uuid,
          quantity: item.quantity * multiplier,
          currency: body.currency,
        },
        bundleSelectionUuid
          ? {
              bundleSourceUuid: bundleSelection.bundle.uuid,
              bundleSelectionUuid,
              bundleMinimumSelectionCount:
                bundleSelection.minimumSelectionCount,
            }
          : null,
      );
    }

    return this.findCart(customer, '', body.currency, '');
  }

  /**
   * Find the cart items for a customer
   * @param customer
   * @param filters
   * @param currency
   * @param sort
   * @returns
   */
  async findCart(
    customer: Customer,
    filters: string,
    currency: CurrencyCode = CurrencyCode.QAR,
    sort: string,
  ): Promise<Array<CartItem>> {
    this.logger.log(`Retrieving cart items for customer: ${customer.uuid}`);

    // Find the items in the customer cart
    const cartItems = await this.cartRepository.find({
      // cache: true,
      relationLoadStrategy: 'query',
      where: {
        product: {
          status: ProductStatus.ACTIVE,
        },
        customer: {
          uuid: customer.uuid,
        },
      },
      relations: {
        product: {
          productCategories: {
            category: {
              campaignCategories: {
                campaign: true,
              },
            },
          },
        },
        variant: {
          inventoryItem: {
            levels: true,
          },
          images: true,
          optionValues: {
            optionValue: {
              option: true,
            },
          },
        },
      },
      order: { id: 'DESC' },
    });

    // Set price and discounted price on each cart item
    const res: Array<CartItem | null> = await Promise.all(
      cartItems.map(async (cartItem) => {
        if (
          !cartItem.product ||
          !cartItem.variant ||
          cartItem.product.status !== ProductStatus.ACTIVE
        ) {
          return null;
        }

        // Calculate the stock of the variant in the inventory
        const stock = calculateStock(cartItem.variant);
        cartItem.product.variants = [];
        cartItem.availableStock = stock;
        cartItem.isAvailable = stock > 0;

        // Find the best campaign for the product in the cart
        const campaign = getBestCampaign(cartItem.product);
        if (campaign !== null) {
          cartItem.product.campaign = campaign;
        }

        // Calculate base price on the variant
        const price = await this.pricingService.applyPriceOnProductVariant(
          cartItem.product,
          cartItem.variant,
          campaign,
          currency,
          false,
        );

        // Calculate discounted price on the variant
        const discountedPrice =
          await this.pricingService.applyPriceOnProductVariant(
            cartItem.product,
            cartItem.variant,
            campaign,
            currency,
            true,
          );

        // Apply base and discounted price on the variant
        cartItem.variant.price = price;
        cartItem.variant.discountedPrice = discountedPrice;

        const itemPrice = multiplyMoney(discountedPrice, cartItem.quantity);

        cartItem.subTotal = itemPrice;

        cartItem.discountPrice = {
          amount: 0,
          minorAmount: 0,
          currencyCode: price.currencyCode,
        };

        cartItem.total = itemPrice;

        return cartItem;
      }),
    );

    const repricedItems = await this.bundlesService.applyBundlesToCartItems(
      res.filter((r) => r !== null),
      currency,
    );
    if (repricedItems.length > 0) {
      await this.cartRepository.save(repricedItems);
    }
    return repricedItems;
  }

  /**
   * Fetch cart count
   *
   * @param customer
   * @returns
   */
  async getCartCount(customer: Customer): Promise<number> {
    this.logger.log(
      `Retrieving the cart item count for customer: ${customer.uuid}`,
    );

    return this.cartRepository.count({
      // cache: true,
      relationLoadStrategy: 'query',
      where: {
        customer: { uuid: customer.uuid },
        product: { status: ProductStatus.ACTIVE },
      },
    });
  }

  /**
   * Update the cart item
   * @param customer
   * @param cartItemUUID
   * @param body
   * @returns
   */
  async update(
    customer: Customer,
    cartItemUUID: string,
    body: UpdateCartItemDto,
  ): Promise<CartItem> {
    this.logger.log(`Updating the cart item: ${cartItemUUID}`);

    // find the cart item to update
    const cartItem = await this.cartRepository.findOne({
      where: {
        uuid: cartItemUUID,
      },
      relations: {
        product: {
          productCategories: {
            category: true,
          },
        },
        variant: {
          inventoryItem: {
            levels: true,
          },
        },
        customer: true,
      },
    });

    // Make sure the cart item exists
    if (!cartItem) {
      throw new NotFoundException({
        error: 'Cart item not found. Please check and try again.',
      });
    }

    // Make sure the product exists and is available for sale.
    if (!cartItem.product || cartItem.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException({
        error: 'Product not available. Please check and try again.',
      });
    }

    // Make sure the variant exists
    if (!cartItem.variant) {
      throw new NotFoundException({
        error: 'Variant not found. Please check and try again.',
      });
    }

    const product = await this.productRepository.findOne({
      where: { uuid: body.productUuid },
      relations: {
        variants: {
          inventoryItem: {
            levels: true,
          },
        },
        productCategories: {
          category: true,
        },
      },
    });

    // Make sure the product exists and is available for sale.
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException({
        error: 'Product not available',
      });
    }

    if (!product.variants || !Array.isArray(product.variants)) {
      throw new BadRequestException({
        error:
          'Failed to find any variant of the product. Please check and try again.',
      });
    }

    // find the specific variant from the product
    const variant = product.variants.find(
      (variant) => variant.uuid === body.variantUuid,
    );
    if (!variant) {
      throw new NotFoundException({
        error:
          'Faild to find the requested variant. Please check and try again.',
      });
    }

    // check the variant stock availability
    const availableStock = calculateStock(variant);
    if (availableStock <= 0) {
      throw new BadRequestException({
        error: 'Product is out of stock. Please try again later.',
      });
    }

    // Make sure the product is in sufficient quantity
    if (availableStock < body.quantity) {
      throw new BadRequestException({
        error: 'Insufficient stock. Please try again later.',
      });
    }

    const campaign = getBestCampaign(product);
    const preserveBundleSelection =
      cartItem.product?.uuid === body.productUuid &&
      cartItem.variant?.uuid === body.variantUuid &&
      !!cartItem.bundleSourceUuid &&
      !!cartItem.bundleSelectionUuid;

    // Calculate the price of the product/variant
    // const price = await this.pricingService.applyPriceOnProductVariant(cartItem.product, cartItem.variant, null, body.currency, false);
    const price = await this.pricingService.applyPriceOnProductVariant(
      cartItem.product,
      cartItem.variant,
      campaign,
      body.currency,
      true,
    );

    //Check if a cart item with the target variant already exists
    const existingItem = await this.cartRepository.findOne({
      where: {
        customer: { id: customer.id },
        product: { uuid: body.productUuid },
        variant: { uuid: body.variantUuid },
        bundleSourceUuid: preserveBundleSelection
          ? cartItem.bundleSourceUuid!
          : IsNull(),
        bundleSelectionUuid: preserveBundleSelection
          ? cartItem.bundleSelectionUuid!
          : IsNull(),
      },
      relations: {
        product: {
          productCategories: {
            category: true,
          },
        },
        variant: {
          inventoryItem: {
            levels: true,
          },
        },
        customer: true,
      },
    });

    // merge the dupliate variant and remove the old one
    if (existingItem && existingItem.uuid !== cartItem.uuid) {
      const mergedQuantity = existingItem.quantity + body.quantity;

      if (availableStock < mergedQuantity) {
        throw new BadRequestException('Insufficient stock after merge');
      }

      const mergedPrice = multiplyMoney(price, mergedQuantity);

      existingItem.product.variants = [];
      existingItem.quantity = mergedQuantity;
      existingItem.subTotal = { ...mergedPrice, currencyCode: body.currency };
      existingItem.discountPrice = {
        amount: 0,
        minorAmount: 0,
        currencyCode: body.currency,
      };
      existingItem.total = { ...mergedPrice, currencyCode: body.currency };

      await this.cartRepository.remove(cartItem);
      await this.cartRepository.save(existingItem);
      return this.repriceAndPersistCustomerCart(
        customer,
        body.currency,
        undefined,
        existingItem.uuid,
      );
    }

    // Update the cart item
    const updatedItemPrice = multiplyMoney(price, body.quantity);

    cartItem.product.variants = [];
    cartItem.variant = variant;
    cartItem.quantity = body.quantity;
    cartItem.bundleSourceUuid = preserveBundleSelection
      ? cartItem.bundleSourceUuid
      : null;
    cartItem.bundleSelectionUuid = preserveBundleSelection
      ? cartItem.bundleSelectionUuid
      : null;
    cartItem.bundleMinimumSelectionCount = preserveBundleSelection
      ? cartItem.bundleMinimumSelectionCount
      : 0;
    cartItem.subTotal = { ...updatedItemPrice, currencyCode: body.currency };
    cartItem.discountPrice = {
      amount: 0,
      minorAmount: 0,
      currencyCode: body.currency,
    };
    cartItem.total = { ...updatedItemPrice, currencyCode: body.currency };

    await this.cartRepository.save(cartItem);
    return this.repriceAndPersistCustomerCart(
      customer,
      body.currency,
      undefined,
      cartItem.uuid,
    );
  }

  /**
   * Remove the cart item
   *
   * @param cartItemUUID
   * @returns
   */
  async removeItem(cartItemUUID: string): Promise<void> {
    this.logger.log(`Removing item ${cartItemUUID} from cart.`);

    const cartItem = await this.cartRepository.findOne({
      where: {
        uuid: cartItemUUID,
      },
      relations: {
        customer: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException({
        error: 'Cart item not found',
      });
    }

    await this.cartRepository.remove(cartItem);

    cartItem.customer.cartItemsCount--;
    if (cartItem.customer.cartItemsCount < 0) {
      cartItem.customer.cartItemsCount = 0;
    }
    await this.customerRepository.save(cartItem.customer);

    const remainingItems = await this.cartRepository.find({
      where: {
        customer: { id: cartItem.customer.id },
        product: { status: ProductStatus.ACTIVE },
      },
      relations: {
        product: {
          productCategories: {
            category: {
              campaignCategories: {
                campaign: true,
              },
            },
          },
        },
        variant: {
          inventoryItem: {
            levels: true,
          },
        },
      },
    });

    if (remainingItems.length > 0) {
      const repricedItems = await this.bundlesService.applyBundlesToCartItems(
        remainingItems,
        remainingItems[0].subTotal.currencyCode,
      );
      await this.cartRepository.save(repricedItems);
    }
  }

  /**
   * Clear the cart
   * @param customer
   * @returns
   */
  async clearCart(customer: Customer): Promise<void> {
    this.logger.log(`Clearing the customer cart: ${customer.uuid}`);

    await this.cartRepository.delete({
      customer: { id: customer.id },
    });

    customer.cartItemsCount = 0;
    await this.customerRepository.save(customer);
  }

  private async repriceAndPersistCustomerCart(
    customer: Customer,
    currency: CurrencyCode,
    countryCode?: string,
    targetCartItemUUID?: string,
  ): Promise<CartItem> {
    const cartItems = await this.cartRepository.find({
      where: {
        customer: { id: customer.id },
        product: { status: ProductStatus.ACTIVE },
      },
      relations: {
        product: {
          productCategories: {
            category: {
              campaignCategories: {
                campaign: true,
              },
            },
          },
        },
        variant: {
          inventoryItem: {
            levels: true,
          },
        },
        customer: true,
      },
      order: { id: 'DESC' },
    });

    const pricedItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        const campaign = getBestCampaign(cartItem.product);
        const price = await this.pricingService.applyPriceOnProductVariant(
          cartItem.product,
          cartItem.variant,
          campaign,
          currency,
          true,
        );
        const itemPrice = multiplyMoney(price, cartItem.quantity);
        cartItem.subTotal = itemPrice;
        cartItem.discountPrice = {
          amount: 0,
          minorAmount: 0,
          currencyCode: currency,
        };
        cartItem.total = itemPrice;
        return cartItem;
      }),
    );

    const repricedItems = await this.bundlesService.applyBundlesToCartItems(
      pricedItems,
      currency,
      countryCode,
    );
    await this.cartRepository.save(repricedItems);

    const matchedItem =
      repricedItems.find((item) => item.uuid === targetCartItemUUID) ??
      repricedItems[0];
    if (!matchedItem) {
      throw new NotFoundException({
        error: 'Cart item not found. Please check and try again.',
      });
    }
    return matchedItem;
  }
}
