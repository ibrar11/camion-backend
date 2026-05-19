import {
	Inject,
	Injectable,
	Logger,
} from '@nestjs/common';

import { BannersService } from '../banners/banners.service';
import { CategoriesService } from '../inventory/categories.service';
import { OrderService } from '../order/order.service';
import { ProductsService } from '../inventory/products.service';
import { StoriesService } from '../stories/stories.service';
import { CustomersService } from 'src/customers/customers.service';

@Injectable()
export class DataService {
	private readonly logger = new Logger(DataService.name);

	constructor(
		@Inject(BannersService) private readonly bannersService: BannersService,
		@Inject(CategoriesService) private readonly categoriesService: CategoriesService,
		@Inject(CustomersService) private readonly customersService: CustomersService,
		@Inject(OrderService) private readonly orderService: OrderService,
		@Inject(ProductsService) private readonly productsService: ProductsService,
		@Inject(StoriesService) private readonly storiesService: StoriesService,
	) { }

	/**
	 * Counts the data
	 *
	 * @returns
	 */
	async getCounts(): Promise<{
		banners: number,
		categories: number,
		customers: number,
		orders: number,
		products: number,
		stories: number,
	}> {
		this.logger.log(`Counts the data`);

		const res = {
			banners: 0,
			categories: 0,
			customers: 0,
			orders: 0,
			products: 0,
			stories: 0,
		};

		// Count the banners
		res.banners = await this.bannersService.countAll();

		// Count the categories
		res.categories = await this.categoriesService.countAll();

		// Count the customers
		res.customers = await this.customersService.countAll();

		// Count the orders
		res.orders = await this.orderService.countAll();

		// Count the product
		res.products = await this.productsService.countAll();

		// Count the stories
		res.stories = await this.storiesService.countAll();

		return res;
	}
}
