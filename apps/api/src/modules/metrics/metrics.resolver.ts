import { UseGuards } from '@nestjs/common';
import { Args, Field, Float, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { MetricsService } from './metrics.service';

@ObjectType()
export class MetricPoint {
    @Field(() => Float) timestamp!: number;
    @Field(() => Float) cpu!: number;
    @Field(() => Float) memory!: number;
    @Field(() => Float) memoryTotal!: number;
    @Field(() => Float) networkIn!: number;
    @Field(() => Float) networkOut!: number;
    @Field(() => Float) tickRate!: number;
    @Field(() => Int) playerCount!: number;
    @Field(() => Int) resourceCount!: number;
    @Field(() => Float) scriptExecutionTime!: number;
}

@ObjectType()
export class ServerSummary {
    @Field(() => Float) avgCpu!: number;
    @Field(() => Float) avgMemory!: number;
    @Field(() => Float) avgTickRate!: number;
    @Field(() => Int) peakPlayers!: number;
    @Field(() => Int) dataPoints!: number;
}

@Resolver()
export class MetricsResolver {
    constructor(private metricsService: MetricsService) { }

    @Query(() => [MetricPoint])
    @UseGuards(AuthGuard)
    async metricsHistory(
        @Args('serverId') serverId: string,
        @Args('from', { type: () => Float }) from: number,
        @Args('to', { type: () => Float }) to: number,
        @Args('resolution', { type: () => Int, nullable: true }) resolution?: number,
    ) {
        return this.metricsService.getMetricsHistory(serverId, from, to, resolution);
    }

    @Query(() => ServerSummary)
    @UseGuards(AuthGuard)
    async serverSummary(@Args('serverId') serverId: string) {
        return this.metricsService.getServerSummary(serverId);
    }
}
