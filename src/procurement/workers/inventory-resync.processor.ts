import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { QueueName } from "../../queue/enums/QueueTypes.enum";
import { InventoryResyncJobData } from "../../queue/types";
import { ProcurementService } from "../procurement.service";

@Processor(QueueName.INVENTORY_RESYNC, { concurrency: 1 })
@Injectable()
export class InventoryResyncProcessor extends WorkerHost {
    private readonly logger = new Logger(InventoryResyncProcessor.name);

    constructor(private readonly procurementService: ProcurementService) {
        super();
    }

    async process(job: Job<InventoryResyncJobData>): Promise<any> {
        this.logger.log(`Processing inventory resync job ${job.id} for ${job.data.productUuids.length} products`);
        return this.procurementService.resyncInventoryVariantsByProducts(job.data.productUuids);
    }
}
