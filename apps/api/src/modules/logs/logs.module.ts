import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LogsResolver } from './logs.resolver';
import { LogsService } from './logs.service';

@Module({
    imports: [AuthModule],
    providers: [LogsService, LogsResolver],
    exports: [LogsService],
})
export class LogsModule { }
