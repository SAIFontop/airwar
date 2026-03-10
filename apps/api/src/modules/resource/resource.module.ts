import { Module } from '@nestjs/common';
import { ResourceResolver } from './resource.resolver';
import { ResourceService } from './resource.service';

@Module({
    providers: [ResourceService, ResourceResolver],
    exports: [ResourceService],
})
export class ResourceModule { }
