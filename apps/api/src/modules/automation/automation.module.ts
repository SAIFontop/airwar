import { Module } from '@nestjs/common';
import { AutomationResolver } from './automation.resolver';
import { AutomationService } from './automation.service';

@Module({
    providers: [AutomationService, AutomationResolver],
    exports: [AutomationService],
})
export class AutomationModule { }
