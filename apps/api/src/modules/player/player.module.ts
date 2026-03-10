import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlayerResolver } from './player.resolver';
import { PlayerService } from './player.service';

@Module({
    imports: [AuthModule],
    providers: [PlayerService, PlayerResolver],
    exports: [PlayerService],
})
export class PlayerModule { }
