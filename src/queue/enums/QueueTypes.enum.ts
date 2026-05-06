export enum QueueName {
    TRANSLATION = 'translation',
    WMS_DISPATCH = 'wms-dispatch',
}

export enum JobPriority {
    CRITICAL = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4,
    BACKGROUND = 5,
}