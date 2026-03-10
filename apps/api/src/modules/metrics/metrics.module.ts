import { Module } from '@nestjs/common';
import { MetricsResolver } from './metrics.resolver';
import { MetricsService } from './metrics.service';

@Module({
    providers: [MetricsService, MetricsResolver],
    exports: [MetricsService],
})
export class MetricsModule { }
