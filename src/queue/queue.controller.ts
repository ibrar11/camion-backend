import { 
    Controller, 
    Delete, 
    Get, 
    Inject 
} from '@nestjs/common';

import { QueueName } from './enums/QueueTypes.enum';

import { QueueService } from './queue.service';

@Controller('v1/queue')
export class QueueController {
    constructor(@Inject(QueueService) private readonly queueService: QueueService) { }

    @Get()
    getHello() {
        return this.queueService.getQueueStats(QueueName.TRANSLATION);
    }

    @Delete()
    clearQueue() {
        return this.queueService.clearAllJobs(QueueName.TRANSLATION);
    }
}
