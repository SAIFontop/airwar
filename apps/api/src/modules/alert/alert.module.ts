import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AlertResolver } from './alert.resolver';
import { AlertService } from './alert.service';

@Module({
    imports: [AuthModule],
    providers: [AlertService, AlertResolver],
    exports: [AlertService],
})
export class AlertModule { }
