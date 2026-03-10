import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServerResolver } from './server.resolver';
import { ServerService } from './server.service';

@Module({
    imports: [AuthModule],
    providers: [ServerService, ServerResolver],
    exports: [ServerService],
})
export class ServerModule { }
