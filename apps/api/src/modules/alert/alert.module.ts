import { Module } from '@nestjs/common';
import { AlertResolver } from './alert.resolver';
import { AlertService } from './alert.service';

@Module({
    providers: [AlertService, AlertResolver],
    exports: [AlertService],
})
export class AlertModule { }
