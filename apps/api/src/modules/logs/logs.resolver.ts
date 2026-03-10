import { UseGuards } from '@nestjs/common';
import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { LogsService } from './logs.service';

@ObjectType()
export class LogEntryType {
    @Field() id!: string;
    @Field() serverId!: string;
    @Field(() => Number) timestamp!: number;
    @Field() level!: string;
    @Field() source!: string;
    @Field() message!: string;
    @Field({ nullable: true }) resource?: string;
    @Field({ nullable: true }) stackTrace?: string;
}

@ObjectType()
class LogQueryResult {
    @Field(() => [LogEntryType]) items!: LogEntryType[];
    @Field(() => Int) total!: number;
}

@ObjectType()
class ErrorCluster {
    @Field(() => Int) count!: number;
    @Field(() => LogEntryType) sample!: LogEntryType;
    @Field(() => Number) firstSeen!: number;
    @Field(() => Number) lastSeen!: number;
}

@Resolver()
export class LogsResolver {
    constructor(private logsService: LogsService) { }

    @Query(() => LogQueryResult)
    @UseGuards(AuthGuard)
    async logs(
        @Args('serverId') serverId: string,
        @Args('level', { type: () => [String], nullable: true }) level?: string[],
        @Args('source', { nullable: true }) source?: string,
        @Args('resource', { nullable: true }) resource?: string,
        @Args('search', { nullable: true }) search?: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    ) {
        return this.logsService.queryLogs({ serverId, level, source, resource, search, limit, offset });
    }

    @Query(() => [ErrorCluster])
    @UseGuards(AuthGuard)
    async errorClusters(@Args('serverId') serverId: string) {
        return this.logsService.getErrorClusters(serverId);
    }
}
