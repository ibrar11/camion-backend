import { Controller, Get, Inject } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueName } from './enums/QueueTypes.enum';

@Controller('v1/queue')
export class QueueController {
    constructor(@Inject(QueueService) private readonly queueService: QueueService) { }

    @Get()
    getHello() {
        return this.queueService.getQueueStats(QueueName.TRANSLATION);
    }
}
