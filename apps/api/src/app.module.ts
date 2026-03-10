import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { GatewayModule } from './gateway/gateway.module';
import { AlertModule } from './modules/alert/alert.module';
import { AuthModule } from './modules/auth/auth.module';
import { AutomationModule } from './modules/automation/automation.module';
import { ConsoleModule } from './modules/console/console.module';
import { FileModule } from './modules/file/file.module';
import { LogsModule } from './modules/logs/logs.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { PlayerModule } from './modules/player/player.module';
import { ResourceModule } from './modules/resource/resource.module';
import { ServerModule } from './modules/server/server.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: process.env.NODE_ENV !== 'production',
            subscriptions: {
                'graphql-ws': true,
            },
            context: ({ req }: { req: unknown }) => ({ req }),
        }),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot(),
        PrismaModule,
        RedisModule,
        AuthModule,
        ServerModule,
        PlayerModule,
        ResourceModule,
        MetricsModule,
        LogsModule,
        AutomationModule,
        ConsoleModule,
        FileModule,
        AlertModule,
        GatewayModule,
    ],
})
export class AppModule { }
