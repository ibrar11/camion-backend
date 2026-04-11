import {
	Inject,
	UseGuards,
} from "@nestjs/common";

import {
	Args,
	ArgsType,
	Field,
	Int,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";

import { ProductSort } from "./enums/ProductSort";

import { Product } from "./entities/product.entity";
import { ProductOption } from "./entities/product-option.entity";
import { ProductOptionValue } from "./entities/product-option-value.entity";
import { ProductVariant } from "./entities/product-variant.entity";

import { ProductsService } from "./products.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetProductsArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "" })
	filters: string;

	@Field({ defaultValue: "" })
	sort: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetProductArgs {
	@Field({ defaultValue: "", })
	slug: string;
}

@ArgsType()
export class SearchProductsArgs {
	@Field()
	query: string;

	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field({ defaultValue: ProductSort.BestMatch, })
	sort: ProductSort;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetRecommendedProductsArgs {
	@Field()
	slug: string;

	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetFeaturedProductsArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetPopularProductsArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetRelatedProductsArgs {
	@Field()
	slug: string;

	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetRecentlyViewedProductsArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field({ defaultValue: "usd", })
	currency: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Product)
export class ProductsResolver {
	constructor(@Inject(ProductsService) private readonly productsService: ProductsService) { }

	@ResolveField("title", () => String)
	getTitle(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const titleMap = {
			"en": product.titleEn,
			"ar": product.titleAr,
		};

		return titleMap[language] ?? product.titleEn;
	}

	@ResolveField("brief", () => String)
	getBrief(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const briefMap = {
			"en": product.briefEn,
			"ar": product.briefAr,
		};

		return briefMap[language] ?? product.briefEn;
	}

	@ResolveField("description", () => String)
	getDescription(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const descriptionMap = {
			"en": product.descriptionEn,
			"ar": product.descriptionAr,
		};

		return descriptionMap[language] ?? product.descriptionEn;
	}

	@ResolveField("descriptionHtml", () => String)
	getDescriptionHtml(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const descriptionHtmlMap = {
			"en": product.descriptionHtmlEn,
			"ar": product.descriptionHtmlAr,
		};

		return descriptionHtmlMap[language] ?? product.descriptionHtmlEn;
	}

	@Query(() => [Product])
	getProducts(@Args() args: GetProductsArgs): Promise<Array<Product>> {
		return this.productsService.findAll(args.filters, args.sort as ProductSort, args.pageNumber, args.itemsPerPage);
	}

	@Query(() => Product, { nullable: true, })
	getProduct(@Args() args: GetProductArgs): Promise<Product> {
		return this.productsService.findOneBySlug(args.slug);
	}

	@Query(() => [Product])
	searchProducts(@Args() args: SearchProductsArgs): Promise<Array<Product>> {
		return this.productsService.searchProducts(args.query, args.language, args.sort, args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Product])
	getRecommendedProducts(@Args() args: GetRecommendedProductsArgs): Promise<Array<Product>> {
		return this.productsService.getRecommendedProducts(args.slug, args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Product])
	getFeaturedProducts(@Args() args: GetFeaturedProductsArgs): Promise<Array<Product>> {
		return this.productsService.getFeaturedProducts(args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Product])
	getPopularProducts(@Args() args: GetPopularProductsArgs): Promise<Array<Product>> {
		return this.productsService.getPopularProducts(args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Product])
	getRelatedProducts(@Args() args: GetRelatedProductsArgs): Promise<Array<Product>> {
		return this.productsService.getRelatedProducts(args.slug, args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Product])
	getRecentlyViewedProducts(@Args() args: GetRecentlyViewedProductsArgs): Promise<Array<Product>> {
		return this.productsService.getRecentlyViewedProducts("", args.pageNumber, args.itemsPerPage);
	}
}

@Resolver(() => ProductOption)
export class ProductOptionResolver {
	@ResolveField("name", () => String)
	getName(@Parent() productOption: ProductOption, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const nameMap = {
			"en": productOption.nameEn,
			"ar": productOption.nameAr,
		};

		return nameMap[language] ?? productOption.nameEn;
	}
}

@Resolver(() => ProductOptionValue)
export class ProductOptionValueResolver {
	@ResolveField("value", () => String)
	getValue(@Parent() productOptionValue: ProductOptionValue, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const ValueMap = {
			"en": productOptionValue.valueEn,
			"ar": productOptionValue.valueAr,
		};

		return ValueMap[language] ?? productOptionValue.valueAr;
	}
}

@Resolver(() => ProductVariant)
export class ProductVariantResolver {
	@ResolveField("title", () => String)
	getName(@Parent() productVariant: ProductVariant, @Args() args: GetProductsArgs): string {
		const language = args.language.toLowerCase() || "en";

		const titleMap = {
			"en": productVariant.titleEn,
			"ar": productVariant.titleAr,
		};

		return titleMap[language] ?? productVariant.titleEn;
	}
}
