import { Module } from '@nestjs/common';
import { LogsResolver } from './logs.resolver';
import { LogsService } from './logs.service';

@Module({
    providers: [LogsService, LogsResolver],
    exports: [LogsService],
})
export class LogsModule { }
