import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FileResolver } from './file.resolver';
import { FileService } from './file.service';

@Module({
    imports: [AuthModule],
    providers: [FileService, FileResolver],
    exports: [FileService],
})
export class FileModule { }
