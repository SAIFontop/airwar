import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResourceResolver } from './resource.resolver';
import { ResourceService } from './resource.service';

@Module({
    imports: [AuthModule],
    providers: [ResourceService, ResourceResolver],
    exports: [ResourceService],
})
export class ResourceModule { }
