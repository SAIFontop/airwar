import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AutomationResolver } from './automation.resolver';
import { AutomationService } from './automation.service';

@Module({
    imports: [AuthModule],
    providers: [AutomationService, AutomationResolver],
    exports: [AutomationService],
})
export class AutomationModule { }
