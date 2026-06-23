import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { QueueName } from "../../queue/enums/QueueTypes.enum";
import { SkuMetaImportJobData } from "../../queue/types";
import { ProcurementService } from "../procurement.service";

@Processor(QueueName.SKU_META_IMPORT, { concurrency: 1 })
@Injectable()
export class SkuMetaImportProcessor extends WorkerHost {
    private readonly logger = new Logger(SkuMetaImportProcessor.name);

    constructor(private readonly procurementService: ProcurementService) {
        super();
    }

    async process(job: Job<SkuMetaImportJobData>): Promise<any> {
        this.logger.log(`Processing skuMeta import job ${job.id} for ${job.data.productUuids.length} products`);
        return this.procurementService.importSkuMetaByProducts(job.data.productUuids);
    }
}
