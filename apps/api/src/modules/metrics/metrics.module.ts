import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MetricsResolver } from './metrics.resolver';
import { MetricsService } from './metrics.service';

@Module({
    imports: [AuthModule],
    providers: [MetricsService, MetricsResolver],
    exports: [MetricsService],
})
export class MetricsModule { }
