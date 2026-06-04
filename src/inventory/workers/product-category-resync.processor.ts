import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { QueueName } from "../../queue/enums/QueueTypes.enum";
import { ProductCategoryResyncJobData } from "../../queue/types";
import { ProductsService } from "../products.service";

@Processor(QueueName.PRODUCT_CATEGORY_RESYNC, { concurrency: 1 })
@Injectable()
export class ProductCategoryResyncProcessor extends WorkerHost {
	private readonly logger = new Logger(ProductCategoryResyncProcessor.name);

	constructor(private readonly productsService: ProductsService) {
		super();
	}

	async process(job: Job<ProductCategoryResyncJobData>): Promise<any> {
		this.logger.log(
			`Processing product category resync job ${job.id} for ${job.data.productUuids.length} products`,
		);
		return this.productsService.resyncProductCategoriesByProducts(job.data.productUuids);
	}
}
