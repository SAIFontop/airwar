import { Module } from '@nestjs/common';
import { ServerResolver } from './server.resolver';
import { ServerService } from './server.service';

@Module({
    providers: [ServerService, ServerResolver],
    exports: [ServerService],
})
export class ServerModule { }
