import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import "dotenv/config";

// auth
import { LoginRequest } from "./auth/entities/login-request.entity";

// banners
import { Banner } from "./banners/entities/banner.entity";
import { BannerCategory } from "./banners/entities/banner-category";

// cart
import { CartItem } from "./cart/entities/cart-items.entity";

// clients
import { Client } from "./clients/entities/client.entity";

// currencies
import { Currency } from "./currencies/entities/currency.entity";

// customers
import { Customer } from "./customers/entities/customer.entity";
import { CustomerAddress } from "./customers/entities/customer-address.entity";

// inventory
import { Category } from "./inventory/entities/category.entity";
import { InventoryItem } from "./inventory/entities/inventory-item.entity";
import { InventoryLevel } from "./inventory/entities/inventory-level.entity";
import { Product } from "./inventory/entities/product.entity";
import { ProductCategory } from "./inventory/entities/product-category.entity";
import { ProductOption } from "./inventory/entities/product-option.entity";
import { ProductOptionValue } from "./inventory/entities/product-option-value.entity";
import { ProductReview } from "./inventory/entities/product-review.entity";
import { ProductReviewImage } from "./inventory/entities/product-review-image.entity";
import { ProductVariant } from "./inventory/entities/product-variant.entity";
import { ProductVariantImage } from "./inventory/entities/product-variant-image.entity";
import { ProductVariantInventoryItem } from "./inventory/entities/product-variant-inventory-item.entity";
import { ProductVariantOptionValue } from "./inventory/entities/product-variant-option-value.entity";
import { Warehouse } from "./inventory/entities/warehouse.entity";
import { ProductView } from "./inventory/entities/product-view.entity";

// languages
import { Language } from "./languages/entities/language.entity";

// notifications
import { Notification } from "./notifications/entities/notification.entity";

// oauth
import { ClientRefreshToken } from "./oauth/entities/oauth-refresh-token.entity";

// order
import { Order } from "./order/entities/order.entity";
import { OrderItem } from "./order/entities/order-item.entity";

// payments
import { PaymentTransaction } from "./payments/entities/payment-transaction.entity";

// posts
import { Post } from "./posts/entities/post.entity";

// referral
import { Affiliate } from "./referral/entities/affiliate.entity";
import { BankAccount } from "./referral/entities/bank-account.entity";
import { Coupon } from "./referral/entities/coupon.entity";
import { Transaction } from "./referral/entities/transaction.entity";
import { Wallet } from "./referral/entities/wallet.entity";

// stories
import { Story } from "./stories/entities/story.entity";
import { StoryFrame } from "./stories/entities/story-frame.entity";

// users
import { User } from "./users/entities/user.entity";

//WishList
import { WishlistItem } from "./wishlist/entities/wishlist.entity";

// JOP WMS
import { JopWmsOrder } from "./jop-wms/entities/jop-wms-order.entity";

// pricing
import { ExchangeRate } from "./pricing/entities/exchange-rate.entity";

// key-value-pairs
import { KeyValuePair } from "./key-value-pairs/entities/key-value-pair.entity";

// promos
import { Promo } from "./promos/entities/promo.entity";

import { ReturnRequest } from "./returns/entities/return-request.entity";
import { ReturnEvidence } from "./returns/entities/return-evidence.entity";

// translation
import { Translation } from "./translation/entities/translation.entity";
import { TranslationItem } from "./translation/entities/translation-item.entity";

// export-requests
import { ExportRequest } from "./export-requests/entities/export-request.entity";

// campaigns
import { Campaign } from "./campaigns/entities/campaign.entity";
import { CampaignCategory } from "./campaigns/entities/campaign-category.entity";

export const CamionDataSource = new DataSource({
	type: "postgres",
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT || "5432"),
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	synchronize: false,
	logging: true,
	namingStrategy: new SnakeNamingStrategy(),
	entities: [
		Affiliate,
		BankAccount,
		Banner,
		BannerCategory,
		CartItem,
		Category,
		Client,
		ClientRefreshToken,
		Coupon,
		Currency,
		Customer,
		CustomerAddress,
		InventoryItem,
		InventoryLevel,
		JopWmsOrder,
		Language,
		LoginRequest,
		Notification,
		Order,
		OrderItem,
		PaymentTransaction,
		Post,
		Product,
		ProductCategory,
		ProductOption,
		ProductOptionValue,
		ProductReview,
		ProductReviewImage,
		ProductVariant,
		ProductVariantImage,
		ProductVariantInventoryItem,
		ProductVariantOptionValue,
		ProductView,
		Story,
		StoryFrame,
		Transaction,
		User,
		Wallet,
		Warehouse,
		WishlistItem,
		ExchangeRate,
		KeyValuePair,
		Promo,
		ReturnRequest,
		ReturnEvidence,
		Translation,
		TranslationItem,
		ExportRequest,
		Campaign,
		CampaignCategory,
	],
	migrations: [
		"src/migrations/*",
	],
});
